import { z } from "zod";
// Type alias for Firestore Timestamp
const TimestampSchema = z.iso.datetime();
// Generic structure for organization references used in multiple places
const OrgRefMapSchema = z.object({
    classes: z.array(z.string()),
    districts: z.array(z.string()),
    families: z.array(z.string()),
    groups: z.array(z.string()),
    schools: z.array(z.string()),
});
// Structure for organizational associations within Users
const OrgAssociationMapSchema = z.object({
    all: z.array(z.string()),
    current: z.array(z.string()),
    dates: z.record(z.string(), TimestampSchema),
});
// Structure for user legal document acceptance within Users
const UserLegalSchema = z.object({
    assent: z.record(z.string(), TimestampSchema),
    tos: z.record(z.string(), TimestampSchema),
});
// Structure for Admin-specific data within Users
const AdminDataSchema = z.object({
    administrationsCreated: z.array(z.string()),
});
// Structure for Assessment Condition Rules within Administrations
const AssessmentConditionRuleSchema = z.object({
    field: z.string(),
    op: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
// Structure for Assessment Conditions within Administrations
const AssessmentConditionsSchema = z.object({
    assigned: z.record(z.string(), z.unknown()),
    conditions: z.array(AssessmentConditionRuleSchema),
});
// Structure for individual Assessments within Administrations
const AssessmentSchema = z.object({
    conditions: AssessmentConditionsSchema,
    params: z.record(z.string(), z.unknown()),
    taskName: z.string(),
    taskId: z.string(),
    variantId: z.string(),
    variantName: z.string(),
});
// Structure for Legal information within Administrations and AssignedOrgs
const LegalInfoSchema = z.object({
    amount: z.string(),
    assent: z.union([z.string(), z.null()]),
    consent: z.union([z.string(), z.null()]),
    expectedTime: z.string(),
});
// Interface for documents in the `administrations` collection
const AdministrationSchema = z.object({
    assessments: z.array(AssessmentSchema),
    classes: z.array(z.string()),
    createdBy: z.string(),
    dateClosed: TimestampSchema,
    dateCreated: TimestampSchema,
    dateOpened: TimestampSchema,
    districts: z.array(z.string()),
    families: z.array(z.string()),
    groups: z.array(z.string()),
    legal: LegalInfoSchema,
    minimalOrgs: OrgRefMapSchema,
    name: z.string(),
    publicName: z.string(),
    readOrgs: OrgRefMapSchema,
    schools: z.array(z.string()),
    sequential: z.boolean(),
    tags: z.array(z.string()),
    testData: z.boolean(),
});
// Interface for documents in the `assignedOrgs` subcollection of `administrations`
const AssignedOrgSchema = z.object({
    administrationId: z.string(),
    createdBy: z.string(),
    dateClosed: TimestampSchema,
    dateCreated: TimestampSchema,
    dateOpened: TimestampSchema,
    legal: LegalInfoSchema,
    name: z.string(),
    orgId: z.string(),
    orgType: z.enum(["classes", "districts", "families", "groups", "schools"]),
    publicName: z.string(),
    testData: z.boolean(),
    timestamp: TimestampSchema,
});
// Interface for the assignments subcollection of `users`
const AssignmentAssessmentSchema = z.object({
    progress: z.object({
        survey: z.string(),
        publicName: z.string(),
        readOrgs: z.object({
            classes: z.array(z.string()),
            districts: z.array(z.string()),
            families: z.array(z.string()),
            groups: z.array(z.string()),
            schools: z.array(z.string()),
        }),
        sequential: z.boolean(),
        started: z.boolean(),
        testData: z.boolean(),
        userData: z.object({
            assessmentPid: z.union([z.string(), z.null()]),
            assessmentUid: z.union([z.string(), z.null()]),
            email: z.string(),
            name: z.union([z.string(), z.null()]),
            username: z.string(),
        }),
    }),
    assessments: z.array(z
        .object({
        optional: z.boolean(),
        taskId: z.string(),
        variantId: z.string(),
        variantName: z.string(),
    })
        .and(z.record(z.string(), z.unknown()))),
    optional: z.boolean(),
    params: z.object({
        taskId: z.string(),
        variantId: z.string(),
        variantName: z.string(),
    }),
    assigningOrgs: z.object({
        classes: z.array(z.string()),
        districts: z.array(z.string()),
        families: z.array(z.string()),
        groups: z.array(z.string()),
        schools: z.array(z.string()),
    }),
    completed: z.boolean(),
    createdBy: z.string(),
    dateAssigned: z.string(),
    dateClosed: z.string(),
    dateCreated: z.string(),
    dateOpened: z.string(),
    demoData: z.boolean(),
    id: z.string(),
    name: z.string(),
});
// Structure for Claims within UserClaims
const ClaimsSchema = z.object({
    adminOrgs: OrgRefMapSchema,
    adminUid: z.string().optional(),
    assessmentUid: z.string().optional(),
    minimalAdminOrgs: OrgRefMapSchema,
    roarUid: z.string().optional(),
    super_admin: z.boolean(),
});
// Interface for documents in the `classes` collection
const ClassSchema = z.object({
    archived: z.boolean(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    createdBy: z.string(),
    districtId: z.string(),
    id: z.string(),
    name: z.string(),
    normalizedName: z.string(),
    schoolId: z.string(),
    tags: z.array(z.string()),
});
// Interface for documents in the `districts` collection
const DistrictSchema = z.object({
    archived: z.boolean(),
    createdAt: TimestampSchema,
    createdBy: z.string(),
    updatedAt: TimestampSchema,
    name: z.string(),
    normalizedName: z.string(),
    tags: z.array(z.string()),
    subGroups: z.array(z.string()).optional(),
    schools: z.array(z.string()).optional(),
});
const DistrictPartialSchema = DistrictSchema.pick({
    name: true,
    normalizedName: true,
    subGroups: true,
    tags: true,
    type: true,
});
// Interface for documents in the `groups` collection
const GroupSchema = z.object({
    archived: z.boolean(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    createdBy: z.string(),
    parentOrgId: z.string(),
    parentOrgType: z.literal("district"),
    name: z.string(),
    normalizedName: z.string(),
    tags: z.array(z.string()),
});
// Tracks versions of legal documents using GitHub as a reference point.
const LegalSchema = z.object({});
// Interface for documents in the `readOrgs` subcollection of `administrations`
const ReadOrgSchema = z.object({
    administrationId: z.string(),
    createdBy: z.string(),
    dateClosed: TimestampSchema,
    dateCreated: TimestampSchema,
    dateOpened: TimestampSchema,
    legal: LegalInfoSchema,
    name: z.string(),
    orgId: z.string(),
    orgType: z.enum(["classes", "districts", "families", "groups", "schools"]),
    publicName: z.string(),
    testData: z.boolean(),
    timestamp: TimestampSchema,
});
// Interface for documents in the `schools` collection
const SchoolSchema = z.object({
    archived: z.boolean(),
    classes: z.array(z.string()).optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
    createdBy: z.string(),
    districtId: z.string(),
    id: z.string(),
    name: z.string(),
    normalizedName: z.string(),
});
// Interface for the stats subcollection of `administrations`
const StatSchema = z.object({
    assignment: z.record(z.string(), z.number()),
    survey: z.record(z.string(), z.number()),
});
// Interface for documents in the `userClaims` collection
const UserClaimsSchema = z.object({
    claims: ClaimsSchema,
    lastUpdated: z.number(),
    testData: z.boolean().optional(),
});
// Interface for documents in the `users` collection
const UserSchema = z.object({
    adminData: AdminDataSchema.optional(),
    assignments: z
        .object({
        assigned: z.array(z.string()),
        completed: z.array(z.string()),
        started: z.array(z.string()),
    })
        .optional(),
    archived: z.boolean(),
    assessmentUid: z.string(),
    classes: OrgAssociationMapSchema,
    createdAt: TimestampSchema,
    displayName: z.string(),
    districts: OrgAssociationMapSchema,
    email: z.string(),
    groups: OrgAssociationMapSchema,
    legal: UserLegalSchema,
    schools: OrgAssociationMapSchema,
    sso: z.string().optional(),
    userType: z.enum(["admin", "teacher", "student", "parent"]),
    testData: z.boolean().optional(),
});
// Export all schemas
export { AdminDataSchema, AdministrationSchema, AssessmentConditionRuleSchema, AssessmentConditionsSchema, AssessmentSchema, AssignedOrgSchema, AssignmentAssessmentSchema, ClaimsSchema, ClassSchema, DistrictSchema, DistrictPartialSchema, GroupSchema, LegalInfoSchema, LegalSchema, OrgAssociationMapSchema, OrgRefMapSchema, ReadOrgSchema, SchoolSchema, StatSchema, TimestampSchema, UserClaimsSchema, UserLegalSchema, UserSchema, };
//# sourceMappingURL=index.js.map