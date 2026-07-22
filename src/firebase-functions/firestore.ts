/**
 * Wire format representations of Firestore documents for client-server
 * communication. Each type includes `id` from the document reference,
 * which Firestore stores outside the document data itself.
 */

/** Wire format representation of a Firestore `tasks/{id}` doc. */
export type SerializedTask = {
  id: string;
  archived: boolean;
  createdAt: string;
  createdBy?: string;
  description: string;
  image: string;
  name: string;
  updatedAt: string;
  updatedBy?: string;
};

/**
 * Wire format representation of Firestore `tasks/{taskId}/variants/{id}` and
 * `tasks/{taskId}/variants/{id}/revisions/*` docs.
 */
export type SerializedTaskVariant = {
  id: string;
  taskId: string;
  archived: boolean;
  createdAt: string;
  createdBy?: string;
  name: string;
  params: Record<string, boolean | number | string>;
  registered: boolean;
  updatedAt: string;
  updatedBy?: string;
};

/** Wire format representation of a Firestore `variantParamSpecs/{id}` doc. */
export type SerializedVariantParamSpec = {
  id: string;
  archived: boolean;
  createdAt: string;
  createdBy: string;
  description: string;
  name: string;
  type: 'boolean' | 'number' | 'string' | 'unknown';
  updatedAt: string;
  updatedBy: string;
};
