import catalogJson from '@/lib/demo-data-catalog.generated.json';

export type DemoIndustry = 'salon' | 'construction' | 'realestate';

export type DemoDataPackage = {
  industry: DemoIndustry;
  label: string;
  company: string;
  business: string;
  file: string;
  url: string;
  bytes: number;
  sha256: string;
  version: string;
  updatedAt: string;
  workbooks: number;
  sheets: number;
  dataRows: number;
  docx: number;
  pdf: number;
  starterMemos: number;
  packageFiles: number;
  manifestSha256: string;
  notice: string;
};

export type DemoDataCatalog = {
  version: string;
  updatedAt: string;
  packages: DemoDataPackage[];
};

export const demoDataCatalog = catalogJson as DemoDataCatalog;
