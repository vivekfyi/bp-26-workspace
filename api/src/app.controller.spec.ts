import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController(new AppService());
  });

  describe('getRoot', () => {
    it('should return metadata', () => {
      const result = appController.getRoot();
      expect(result.name).toBe('api-boilerplate');
      expect(result.version).toBe('0.1.0');
      expect(result.timestamp).toBeDefined();
    });
  });
});
