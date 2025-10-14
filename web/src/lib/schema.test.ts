import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateCityPageSchema,
} from './schema';
import { mockFarmData, mockCategoryData, mockLocationData } from '@/test-utils/mockData';

describe('Schema Generation Functions', () => {
  describe('generateOrganizationSchema', () => {
    it('should generate valid organization schema', () => {
      const schema = generateOrganizationSchema();
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('PickAFarm');
      expect(schema.url).toBe('https://pickafarm.com');
      expect(schema.logo).toBe('https://pickafarm.com/android-chrome-512x512.png');
      expect(schema.sameAs).toHaveLength(2);
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate breadcrumb schema with items', () => {
      const items = [{ name: 'Home', item: 'https://pickafarm.com' }, { name: 'Category' }];
      const schema = generateBreadcrumbSchema(items);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
      expect(schema.itemListElement[0].item).toBe('https://pickafarm.com');
      expect(schema.itemListElement[1].position).toBe(2);
      expect(schema.itemListElement[1].name).toBe('Category');
    });
  });

  describe('generateCollectionPageSchema', () => {
    it('should generate collection page schema with farms', () => {
      const farms = [mockFarmData(), mockFarmData({ id: '67890', name: 'Second Farm' })];
      const category = mockCategoryData();
      const location = mockLocationData();

      const schema = generateCollectionPageSchema(farms, category, location);

      expect(schema['@type']).toBe('CollectionPage');
      expect(schema.name).toBe('Pick Your Own Apples Near Montreal, QC');
      expect(schema.mainEntity?.['@type']).toBe('ItemList');
      expect(schema.mainEntity?.numberOfItems).toBe(2);
    });

    it('should throw error with invalid category data', () => {
      const farms = [mockFarmData()];
      const invalidCategory = { name: '', slug: '' };
      const location = mockLocationData();

      expect(() => {
        generateCollectionPageSchema(farms, invalidCategory, location);
      }).toThrow('Invalid category or location data');
    });
  });

  describe('generateCityPageSchema', () => {
    it('should generate city page schema with farms', () => {
      const farms = [mockFarmData()];
      const location = mockLocationData();

      const schema = generateCityPageSchema(farms, location);

      expect(schema['@type']).toBe('CollectionPage');
      expect(schema.name).toBe('All Farms Near Montreal, QC');
      expect(schema.url).toBe('https://pickafarm.com/farms-near/montreal-qc-ca');
      expect(schema.mainEntity?.numberOfItems).toBe(1);
    });
  });
});
