import { PagesDB } from './database';
import { CompanyPage } from './models/company';
import { IncidentPage } from './models/incident';
import { ProductPage } from './models/product';
import { ProductLinePage } from './models/product-line';

describe('PagesDB', () => {
    describe('PagesDB page entries', () => {
        test('should find page entries', () => {
            const pagesDb = new PagesDB();

            pagesDb.setPages({
                Company: [
                    {
                        PageID: '1',
                        PageName: 'something1',
                        Description: 'test description',
                        Industry: '',
                        ParentCompany: '',
                        Type: '',
                        Website: '',
                    },
                ],
                Incident: [
                    {
                        PageID: '1',
                        PageName: 'something2',
                        Company: '',
                        Description: '',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                ],
                Product: [
                    {
                        PageID: '1',
                        PageName: 'something3',
                        Category: '',
                        Company: '',
                        Description: '',
                        ProductLine: '',
                        Website: '',
                    },
                ],
                ProductLine: [
                    {
                        PageID: '1',
                        PageName: 'something4',
                        Description: 'test description',
                        Category: '',
                        Company: '',
                        Website: '',
                    },
                ],
            });

            const results1 = pagesDb.fuzzySearch('The something1');
            expect(results1.totalPagesFound).toBe(1);

            const results2 = pagesDb.fuzzySearch('The something1 product and the something2');
            expect(results2.totalPagesFound).toBe(2);
        });
    });

    describe('PagesDB fuzzySearch', () => {
        let pagesDb: PagesDB;

        beforeEach(() => {
            pagesDb = new PagesDB();

            pagesDb.setPages({
                Company: [
                    {
                        PageID: '4',
                        PageName: 'Phone Repair Shop',
                        Description: 'Phones are complex',
                        Industry: 'Hardware',
                        ParentCompany: '',
                        Type: '',
                        Website: '',
                    },
                ],
                Incident: [
                    {
                        PageID: '1',
                        PageName: 'Laptop Repair Info',
                        Company: 'Laptop',
                        Description: 'Laptop info',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                    {
                        PageID: '2',
                        PageName: 'Laptop Repairs Q&A',
                        Company: 'Laptop',
                        Description: 'Laptop Q&A',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                    {
                        PageID: '3',
                        PageName: 'Laptop is repairable',
                        Company: 'Laptop',
                        Description: 'Laptop instructions',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                    {
                        PageID: '5',
                        PageName: 'Laptop Keyboard tips',
                        Company: 'Laptop',
                        Description: 'Laptop hardware tips',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                    {
                        PageID: '6',
                        PageName: 'Laptop Repaired Success',
                        Company: 'Laptop',
                        Description: 'Laptop fix success',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                ],
                Product: [],
                ProductLine: [],
            });
        });

        test('should match the single word "repair" only in whole-word contexts', () => {
            const results = pagesDb.fuzzySearch('repair');
            const matchedTitles = results.pageEntries.map((entry) => entry.pageName);

            expect(matchedTitles).toEqual(['Phone Repair Shop', 'Laptop Repair Info']);
        });

        test('should match any of the words: "laptop repair" when matchAllWords = false', () => {
            const results = pagesDb.fuzzySearch('laptop repair', false);
            const matchedTitles = results.pageEntries.map((entry) => entry.pageName);

            expect(matchedTitles).toEqual([
                'Laptop Repair Info', // matches "laptop" & "repair"
                'Phone Repair Shop', // matches "repair"
                'Laptop Repairs Q&A', // matches "laptop" but NOT "repair"
                'Laptop is repairable', // matches "laptop" but NOT "repair"
                'Laptop Keyboard tips', // matches "laptop"
                'Laptop Repaired Success', // matches "laptop" but NOT "repair"
            ]);
        });

        test('should require ALL words ("laptop" and "repair") when matchAllWords = true', () => {
            const results = pagesDb.fuzzySearch('laptop repair', true);
            const matchedTitles = results.pageEntries.map((entry) => entry.pageName);

            expect(matchedTitles).toEqual(['Laptop Repair Info']);
        });

        test('should sort by descending number of matched words', () => {
            const results = pagesDb.fuzzySearch('laptop info repair');
            const matchedTitles = results.pageEntries.map((entry) => entry.pageName);

            expect(matchedTitles[0]).toBe('Laptop Repair Info');
        });
    });

    describe('PagesDB findConsecutiveWords search', () => {
        let pagesDb: PagesDB;

        beforeEach(() => {
            pagesDb = new PagesDB();
            pagesDb.setPages({
                Company: [
                    {
                        PageID: '1',
                        PageName: 'LG',
                        Description: '(Placeholder text for article in Electronics companies)',
                        Industry: 'Electronics companies',
                        ParentCompany: '',
                        Type: '',
                        Website: '',
                    },
                ],
                Incident: [
                    {
                        PageID: '2',
                        PageName: 'LG G4 Fiasco',
                        Company: 'LG',
                        Description: '(Placeholder text for article in LG)',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                    {
                        PageID: '3',
                        PageName: 'LG refrigerator warranty scandal',
                        Company: 'LG',
                        Description: '(Placeholder text for article in LG)',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                    {
                        PageID: '4',
                        PageName: 'LG Television sale of personal data',
                        Company: 'LG',
                        Description: '(Placeholder text for article in LG)',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                    {
                        PageID: '5',
                        PageName: 'Xiaomi Phone unlock requirements and procedure',
                        Company: 'Xiaomi',
                        Description: '(Placeholder text for article in Xiaomi)',
                        EndDate: '',
                        Product: '',
                        ProductLine: '',
                        StartDate: '',
                        Status: '',
                        Type: '',
                    },
                ],
                Product: [],
                ProductLine: [],
            });
        });

        test('find only LG G4 phone Fiasco article', () => {
            const results1 = pagesDb.findConsecutiveWords('LG G4 Phone');
            expect(results1.totalPagesFound).toBe(1); // To find the product only
        });
    });

    describe('PagesDB how do you like them apples', () => {
        let pagesDb: PagesDB;

        beforeEach(() => {
            pagesDb = new PagesDB();
            pagesDb.setPages({
                Company: [
                    {
                        PageID: '1',
                        PageName: 'Apple',
                        Description: 'shiny stuff alert',
                        Industry: 'Hardware',
                        ParentCompany: '',
                        Type: '',
                        Website: '',
                    },
                ],
                Incident: [],
                Product: [],
                ProductLine: [],
            });
        });

        test('should match the single word "Apple" only in whole-word contexts', () => {
            const results = pagesDb.fuzzySearch('apple');
            const matchedTitles = results.pageEntries.map((page) => page.pageName);

            expect(matchedTitles).toEqual(['Apple']);
        });
    });

    describe('Ensure the baked-in default PagesDB has some content', () => {
        let pagesDb: PagesDB;

        beforeEach(() => {
            pagesDb = new PagesDB();
            pagesDb.initDefaultPages();
        });

        test('ensure there is at least one page entry', () => {
            const pages = pagesDb.allPages;
            expect(pages.length).toBeGreaterThan(0);
        });

        test('ensure the first entry is a valid PageEntry', () => {
            const pages = pagesDb.allPages;
            expect(pages.length).toBeGreaterThan(0);
            expect(pages[0]).toBeInstanceOf(CompanyPage || IncidentPage || ProductPage || ProductLinePage);
        });
    });
});
