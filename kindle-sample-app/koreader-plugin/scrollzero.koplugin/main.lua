local ButtonDialog = require("ui/widget/buttondialog")
local InfoMessage = require("ui/widget/infomessage")
local Menu = require("ui/widget/menu")
local NetworkMgr = require("ui/network/manager")
local TextViewer = require("ui/widget/textviewer")
local UIManager = require("ui/uimanager")
local WidgetContainer = require("ui/widget/container/widgetcontainer")
local JSON = require("json")
local ltn12 = require("ltn12")
local logger = require("logger")
local _ = require("gettext")

local ScrollZero = WidgetContainer:extend{
    name = "scrollzero",
    api_base_url = "https://www.scroll0.com/api",
    limit = 20,
    timeout = 15,
    cache_file = "/mnt/us/scrollzero-sample/cache/articles.json",
}

local function trim(value)
    return (value or ""):gsub("^%s+", ""):gsub("%s+$", "")
end

local function read_config(path)
    local file = io.open(path, "r")
    if not file then return end
    for line in file:lines() do
        local key, value = line:match("^%s*([%w_]+)%s*=%s*(.-)%s*$")
        if key and value and value ~= "" then
            if key == "SCROLLZERO_API_BASE_URL" then
                ScrollZero.api_base_url = value
            elseif key == "SCROLLZERO_LIMIT" then
                ScrollZero.limit = math.min(20, math.max(1, tonumber(value) or ScrollZero.limit))
            elseif key == "SCROLLZERO_TIMEOUT" then
                ScrollZero.timeout = tonumber(value) or ScrollZero.timeout
            end
        end
    end
    file:close()
end

local function first_line(value)
    return trim((value or ""):match("^[^\n]*") or "")
end

function ScrollZero:init()
    read_config("/mnt/us/extensions/ScrollZero/config.env")
    self:registerMainMenuItem()
end

function ScrollZero:registerMainMenuItem()
    self.ui.menu:registerToMainMenu(self)
end

function ScrollZero:addToMainMenu(menu_items)
    menu_items.scrollzero = {
        text = _("Scroll Zero"),
        sub_item_table_func = function()
            return {
                {
                    text = _("Open reading queue"),
                    callback = function() self:showFeed(false) end,
                },
                {
                    text = _("Refresh from API"),
                    callback = function() self:showFeed(true) end,
                },
            }
        end,
    }
end

function ScrollZero:request(path)
    local https = require("ssl.https")
    local body = {}
    local url = self.api_base_url .. path
    local ok, code = https.request{
        url = url,
        method = "GET",
        headers = {
            ["Accept"] = "application/json",
            ["User-Agent"] = "ScrollZero-KOReader/0.3.0",
        },
        sink = ltn12.sink.table(body),
        timeout = self.timeout,
    }
    if not ok or tonumber(code) ~= 200 then
        return nil, string.format("API request failed (%s)", tostring(code or ok))
    end
    return table.concat(body)
end

function ScrollZero:saveCache(raw)
    local dir = "/mnt/us/scrollzero-sample/cache"
    os.execute("mkdir -p " .. dir)
    local temp = self.cache_file .. ".tmp"
    local file = io.open(temp, "w")
    if not file then return false end
    file:write(raw)
    file:close()
    os.rename(temp, self.cache_file)
    return true
end

function ScrollZero:loadCache()
    local file = io.open(self.cache_file, "r")
    if not file then return nil end
    local raw = file:read("*a")
    file:close()
    local ok, decoded = pcall(JSON.decode, raw)
    if ok and decoded and decoded.items then return decoded end
    return nil
end

function ScrollZero:showFeed(force_refresh)
    NetworkMgr:runWhenConnected(function()
        local loading = InfoMessage:new{ text = force_refresh and _("Refreshing Scroll Zero…") or _("Loading Scroll Zero…"), timeout = 0 }
        UIManager:show(loading)
        local data
        local error_message
        if force_refresh or not self.feed_data then
            local raw
            raw, error_message = self:request(string.format("/articles?page=1&limit=%d", self.limit))
            if raw then
                self:saveCache(raw)
                local ok, decoded = pcall(JSON.decode, raw)
                if ok then self.feed_data = decoded else error_message = _("The API returned invalid JSON.") end
            end
        end
        data = self.feed_data or self:loadCache()
        UIManager:close(loading)
        if not data or not data.items then
            UIManager:show(InfoMessage:new{ text = error_message or _("No cached articles are available."), timeout = 4 })
            return
        end
        self.feed_data = data
        self:showArticleMenu(data.items, error_message)
    end)
end

function ScrollZero:showArticleMenu(articles, stale_error)
    local items = {}
    if stale_error then
        table.insert(items, { text = _("Offline cache (refresh failed)"), mandatory = "!", enabled = false })
    end
    for _, article in ipairs(articles) do
        local source = article.source and article.source.name or "Scroll Zero"
        local category = article.source and article.source.category or ""
        table.insert(items, {
            text = first_line(article.title) ~= "" and first_line(article.title) or _("Untitled article"),
            mandatory = category ~= "" and category or source,
            article = article,
        })
    end
    local menu
    menu = Menu:new{
        title = _("Scroll Zero · Reading queue"),
        item_table = items,
        covers_fullscreen = true,
        is_borderless = true,
        is_popout = false,
        title_bar_fm_style = true,
        title_bar_left_icon = "appbar.menu",
        onLeftButtonTap = function() self:showFeedMenu(menu) end,
        onMenuSelect = function(menu_self, item)
            if item.article then self:showArticle(item.article) end
        end,
    }
    UIManager:show(menu)
end

function ScrollZero:showFeedMenu(menu)
    local dialog
    dialog = ButtonDialog:new{
        buttons = {
            {{ text = _("Refresh feed"), callback = function() UIManager:close(dialog); UIManager:close(menu); self:showFeed(true) end }},
            {{ text = _("Show cached feed"), callback = function() UIManager:close(dialog); UIManager:close(menu); self.feed_data = self:loadCache(); self:showFeed(false) end }},
            {{ text = _("Close"), callback = function() UIManager:close(dialog) end }},
        },
    }
    UIManager:show(dialog)
end

function ScrollZero:showArticle(article)
    local source = article.source and article.source.name or "Scroll Zero"
    local text = {}
    table.insert(text, source)
    if article.author and article.author ~= "" then table.insert(text, "By " .. article.author) end
    table.insert(text, "")
    if article.summaryShort and article.summaryShort ~= "" then
        table.insert(text, "IN BRIEF")
        table.insert(text, article.summaryShort)
        table.insert(text, "")
    end
    if type(article.summaryBullets) == "table" and #article.summaryBullets > 0 then
        table.insert(text, "KEY TAKEAWAYS")
        for _, bullet in ipairs(article.summaryBullets) do table.insert(text, "• " .. tostring(bullet)) end
        table.insert(text, "")
    end
    if article.fullText and article.fullText ~= "" then
        table.insert(text, "ARTICLE")
        table.insert(text, article.fullText)
    else
        table.insert(text, "Open the original article for the full text:")
        table.insert(text, article.originalUrl or "")
    end
    local viewer = TextViewer:new{
        title = first_line(article.title),
        text = table.concat(text, "\n\n"),
        text_type = "book_info",
    }
    UIManager:show(viewer)
end

return ScrollZero
