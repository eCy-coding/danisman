/**
 * P57.1 — Admin UI primitives barrel export.
 *
 * Tek noktadan import:
 *   import { DataTable, FormField, Modal, ConfirmDialog, StatCard, Tabs, Drawer, Accordion, EmptyState, Breadcrumb } from '@/components/admin/ui';
 */

export { DataTable } from './DataTable';
export type { Column, BulkAction, DataTableProps } from './DataTable';

export { FormField, fieldClassName } from './FormField';
export type { FormFieldProps } from './FormField';

export { Modal, ConfirmDialog } from './Modal';
export type { ModalProps, ConfirmDialogProps } from './Modal';

export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';

export { Tabs } from './Tabs';
export type { TabItem, TabsProps } from './Tabs';

export { Drawer } from './Drawer';
export type { DrawerProps } from './Drawer';

export { Accordion } from './Accordion';
export type { AccordionItem } from './Accordion';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbItem } from './Breadcrumb';

export { ErrorState, AdminQueryState, getErrorMessage } from './AdminStateBlock';
export type { ErrorStateProps, AdminQueryStateProps } from './AdminStateBlock';
