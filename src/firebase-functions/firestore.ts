/**
 * Wire format representations of Firestore documents for client-server
 * communication. Each type includes `id` from the document reference,
 * which Firestore stores outside the document data itself.
 */

/** Wire format representation of a Firestore `tasks/{id}` document. */
export type SerializedTask = {
  id: string;
  createdAt: string;
  description: string;
  image: string;
  name: string;
  registered: boolean;
  updatedAt: string;
};

/** Wire format representation of a Firestore `tasks/{taskId}/schemas/{id}` document. */
export type SerializedTaskSchema = {
  id: string;
  taskId: string;
  createdAt: string;
  createdBy: string;
  paramDefinitions: Record<
    string,
    {
      description: string;
      type: 'boolean' | 'number' | 'string';
      required?: boolean;
    }
  >;
  version: number;
};

/** Wire format representation of a Firestore `tasks/{taskId}/variants/{id}` document. */
export type SerializedTaskVariant = {
  id: string;
  taskId: string;
  createdAt: string;
  name: string;
  params: Record<string, boolean | number | string>;
  registered: boolean;
  schemaVersion: number;
  updatedAt: string;
};
