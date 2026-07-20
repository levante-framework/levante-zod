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
  description: string;
  image: string;
  name: string;
  updatedAt: string;
};

/** Wire format representation of a Firestore `tasks/{taskId}/variants/{id}` doc. */
export type SerializedTaskVariant = {
  id: string;
  taskId: string;
  createdAt: string;
  createdBy: string;
  name: string;
  params: Record<string, boolean | number | string>;
  registered: boolean;
  updatedAt: string;
};

/** Wire format representation of a Firestore `variantParamSpecs/{id}` doc. */
export type SerializedVariantParamSpec = {
  id: string;
  archived: boolean;
  createdAt: string;
  description: string;
  name: string;
  type: 'boolean' | 'number' | 'string' | 'unknown';
  updatedAt: string;
};
