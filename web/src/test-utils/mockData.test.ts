import { describe, it, expect } from 'vitest';
import {
  mockFarmData,
  mockApiFarmData,
  mockCategoryData,
  mockLocationData,
  mockFarmList,
} from './mockData';

describe('Mock Data Factories', () => {
  describe('mockFarmData', () => {
    it('should create farm data with default values', () => {
      const farm = mockFarmData();
      expect(farm.id).toBe('12345');
      expect(farm.name).toBe('Mock Farm');
      expect(farm.slug).toBe('mock-farm');
      expect(farm.city).toBe('Montreal');
      expect(farm.province).toBe('QC');
      expect(farm.featured).toBe(0);
    });

    it('should override default values', () => {
      const farm = mockFarmData({
        id: 'custom-id',
        name: 'Custom Farm',
        featured: 1,
      });
      expect(farm.id).toBe('custom-id');
      expect(farm.name).toBe('Custom Farm');
      expect(farm.featured).toBe(1);
      // Should keep defaults for other fields
      expect(farm.city).toBe('Montreal');
    });
  });

  describe('mockApiFarmData', () => {
    it('should create API farm data with boolean featured', () => {
      const farm = mockApiFarmData();
      expect(farm.featured).toBe(false);
      expect(typeof farm.featured).toBe('boolean');
    });

    it('should override featured as boolean', () => {
      const farm = mockApiFarmData({ featured: true });
      expect(farm.featured).toBe(true);
    });
  });

  describe('mockCategoryData', () => {
    it('should create category data with defaults', () => {
      const category = mockCategoryData();
      expect(category.name).toBe('Pick Your Own Apples');
      expect(category.slug).toBe('pick-your-own-apples');
    });

    it('should override category values', () => {
      const category = mockCategoryData({
        name: 'Pumpkin Patch',
        slug: 'pumpkin-patch',
      });
      expect(category.name).toBe('Pumpkin Patch');
      expect(category.slug).toBe('pumpkin-patch');
    });
  });

  describe('mockLocationData', () => {
    it('should create location data with defaults', () => {
      const location = mockLocationData();
      expect(location.name).toBe('Montreal');
      expect(location.province).toBe('QC');
      expect(location.location_slug).toBe('montreal-qc-ca');
      expect(location.farms).toEqual([]);
    });
  });

  describe('mockFarmList', () => {
    it('should create array of farms with specified count', () => {
      const farms = mockFarmList(5);
      expect(farms).toHaveLength(5);
      expect(farms[0].id).toBe('farm-1');
      expect(farms[0].name).toBe('Mock Farm 1');
      expect(farms[4].id).toBe('farm-5');
      expect(farms[4].name).toBe('Mock Farm 5');
    });

    it('should apply overrides to specific farms', () => {
      const overrides = [
        { name: 'Custom Farm 1', city: 'Toronto' },
        undefined,
        { name: 'Custom Farm 3' },
      ];
      const farms = mockFarmList(3, overrides);

      expect(farms[0].name).toBe('Custom Farm 1');
      expect(farms[0].city).toBe('Toronto');
      expect(farms[1].name).toBe('Mock Farm 2'); // No override
      expect(farms[2].name).toBe('Custom Farm 3');
      expect(farms[2].city).toBe('Montreal'); // Default value kept
    });

    it('should create empty array when count is 0', () => {
      const farms = mockFarmList(0);
      expect(farms).toHaveLength(0);
    });
  });
});
