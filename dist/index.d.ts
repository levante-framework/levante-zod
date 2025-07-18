import { z } from "zod";
declare const TimestampSchema: z.ZodISODateTime;
declare const OrgRefMapSchema: z.ZodObject<{
    classes: z.ZodArray<z.ZodString>;
    districts: z.ZodArray<z.ZodString>;
    families: z.ZodArray<z.ZodString>;
    groups: z.ZodArray<z.ZodString>;
    schools: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
declare const OrgAssociationMapSchema: z.ZodObject<{
    all: z.ZodArray<z.ZodString>;
    current: z.ZodArray<z.ZodString>;
    dates: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
}, z.core.$strip>;
declare const UserLegalSchema: z.ZodObject<{
    assent: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
    tos: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
}, z.core.$strip>;
declare const AdminDataSchema: z.ZodObject<{
    administrationsCreated: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
declare const AssessmentConditionRuleSchema: z.ZodObject<{
    field: z.ZodString;
    op: z.ZodString;
    value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
}, z.core.$strip>;
declare const AssessmentConditionsSchema: z.ZodObject<{
    assigned: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        op: z.ZodString;
        value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
    }, z.core.$strip>>;
}, z.core.$strip>;
declare const AssessmentSchema: z.ZodObject<{
    conditions: z.ZodObject<{
        assigned: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        conditions: z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            op: z.ZodString;
            value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    taskName: z.ZodString;
    taskId: z.ZodString;
    variantId: z.ZodString;
    variantName: z.ZodString;
}, z.core.$strip>;
declare const LegalInfoSchema: z.ZodObject<{
    amount: z.ZodString;
    assent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
    consent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
    expectedTime: z.ZodString;
}, z.core.$strip>;
declare const AdministrationSchema: z.ZodObject<{
    assessments: z.ZodArray<z.ZodObject<{
        conditions: z.ZodObject<{
            assigned: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            conditions: z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                op: z.ZodString;
                value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        taskName: z.ZodString;
        taskId: z.ZodString;
        variantId: z.ZodString;
        variantName: z.ZodString;
    }, z.core.$strip>>;
    classes: z.ZodArray<z.ZodString>;
    createdBy: z.ZodString;
    dateClosed: z.ZodISODateTime;
    dateCreated: z.ZodISODateTime;
    dateOpened: z.ZodISODateTime;
    districts: z.ZodArray<z.ZodString>;
    families: z.ZodArray<z.ZodString>;
    groups: z.ZodArray<z.ZodString>;
    legal: z.ZodObject<{
        amount: z.ZodString;
        assent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
        consent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
        expectedTime: z.ZodString;
    }, z.core.$strip>;
    minimalOrgs: z.ZodObject<{
        classes: z.ZodArray<z.ZodString>;
        districts: z.ZodArray<z.ZodString>;
        families: z.ZodArray<z.ZodString>;
        groups: z.ZodArray<z.ZodString>;
        schools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    name: z.ZodString;
    publicName: z.ZodString;
    readOrgs: z.ZodObject<{
        classes: z.ZodArray<z.ZodString>;
        districts: z.ZodArray<z.ZodString>;
        families: z.ZodArray<z.ZodString>;
        groups: z.ZodArray<z.ZodString>;
        schools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    schools: z.ZodArray<z.ZodString>;
    sequential: z.ZodBoolean;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    testData: z.ZodBoolean;
}, z.core.$strip>;
declare const AssignedOrgSchema: z.ZodObject<{
    administrationId: z.ZodString;
    createdBy: z.ZodString;
    dateClosed: z.ZodISODateTime;
    dateCreated: z.ZodISODateTime;
    dateOpened: z.ZodISODateTime;
    legal: z.ZodObject<{
        amount: z.ZodString;
        assent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
        consent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
        expectedTime: z.ZodString;
    }, z.core.$strip>;
    name: z.ZodString;
    orgId: z.ZodString;
    orgType: z.ZodEnum<{
        classes: "classes";
        districts: "districts";
        families: "families";
        groups: "groups";
        schools: "schools";
    }>;
    publicName: z.ZodString;
    testData: z.ZodBoolean;
    timestamp: z.ZodISODateTime;
}, z.core.$strip>;
declare const AssignmentAssessmentSchema: z.ZodObject<{
    progress: z.ZodObject<{
        survey: z.ZodString;
        publicName: z.ZodString;
        readOrgs: z.ZodObject<{
            classes: z.ZodArray<z.ZodString>;
            districts: z.ZodArray<z.ZodString>;
            families: z.ZodArray<z.ZodString>;
            groups: z.ZodArray<z.ZodString>;
            schools: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        sequential: z.ZodBoolean;
        started: z.ZodBoolean;
        testData: z.ZodBoolean;
        userData: z.ZodObject<{
            assessmentPid: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
            assessmentUid: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
            email: z.ZodString;
            name: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
            username: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>;
    assessments: z.ZodArray<z.ZodIntersection<z.ZodObject<{
        optional: z.ZodBoolean;
        taskId: z.ZodString;
        variantId: z.ZodString;
        variantName: z.ZodString;
    }, z.core.$strip>, z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    optional: z.ZodBoolean;
    params: z.ZodObject<{
        taskId: z.ZodString;
        variantId: z.ZodString;
        variantName: z.ZodString;
    }, z.core.$strip>;
    assigningOrgs: z.ZodObject<{
        classes: z.ZodArray<z.ZodString>;
        districts: z.ZodArray<z.ZodString>;
        families: z.ZodArray<z.ZodString>;
        groups: z.ZodArray<z.ZodString>;
        schools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    completed: z.ZodBoolean;
    createdBy: z.ZodString;
    dateAssigned: z.ZodString;
    dateClosed: z.ZodString;
    dateCreated: z.ZodString;
    dateOpened: z.ZodString;
    demoData: z.ZodBoolean;
    id: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
declare const ClaimsSchema: z.ZodObject<{
    adminOrgs: z.ZodObject<{
        classes: z.ZodArray<z.ZodString>;
        districts: z.ZodArray<z.ZodString>;
        families: z.ZodArray<z.ZodString>;
        groups: z.ZodArray<z.ZodString>;
        schools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    adminUid: z.ZodOptional<z.ZodString>;
    assessmentUid: z.ZodOptional<z.ZodString>;
    minimalAdminOrgs: z.ZodObject<{
        classes: z.ZodArray<z.ZodString>;
        districts: z.ZodArray<z.ZodString>;
        families: z.ZodArray<z.ZodString>;
        groups: z.ZodArray<z.ZodString>;
        schools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    roarUid: z.ZodOptional<z.ZodString>;
    super_admin: z.ZodBoolean;
}, z.core.$strip>;
declare const ClassSchema: z.ZodObject<{
    archived: z.ZodBoolean;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    createdBy: z.ZodString;
    districtId: z.ZodString;
    id: z.ZodString;
    name: z.ZodString;
    normalizedName: z.ZodString;
    schoolId: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodString;
}, z.core.$strip>;
declare const CreateClassSchema: z.ZodObject<{
    name: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    districtId: z.ZodString;
    normalizedName: z.ZodString;
    schoolId: z.ZodString;
    type: z.ZodString;
}, z.core.$strip>;
declare const DistrictSchema: z.ZodObject<{
    archived: z.ZodBoolean;
    createdAt: z.ZodISODateTime;
    createdBy: z.ZodString;
    updatedAt: z.ZodISODateTime;
    name: z.ZodString;
    normalizedName: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodString;
    subGroups: z.ZodOptional<z.ZodArray<z.ZodString>>;
    schools: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
declare const CreateDistrictSchema: z.ZodObject<{
    name: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    normalizedName: z.ZodString;
    type: z.ZodString;
    subGroups: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
declare const GroupSchema: z.ZodObject<{
    archived: z.ZodBoolean;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    createdBy: z.ZodString;
    parentOrgId: z.ZodString;
    parentOrgType: z.ZodLiteral<"district">;
    name: z.ZodString;
    normalizedName: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodString;
}, z.core.$strip>;
declare const CreateGroupSchema: z.ZodObject<{
    name: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    normalizedName: z.ZodString;
    type: z.ZodString;
    parentOrgId: z.ZodString;
    parentOrgType: z.ZodLiteral<"district">;
}, z.core.$strip>;
declare const LegalSchema: z.ZodObject<{}, z.core.$strip>;
declare const ReadOrgSchema: z.ZodObject<{
    administrationId: z.ZodString;
    createdBy: z.ZodString;
    dateClosed: z.ZodISODateTime;
    dateCreated: z.ZodISODateTime;
    dateOpened: z.ZodISODateTime;
    legal: z.ZodObject<{
        amount: z.ZodString;
        assent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
        consent: z.ZodUnion<readonly [z.ZodString, z.ZodNull]>;
        expectedTime: z.ZodString;
    }, z.core.$strip>;
    name: z.ZodString;
    orgId: z.ZodString;
    orgType: z.ZodEnum<{
        classes: "classes";
        districts: "districts";
        families: "families";
        groups: "groups";
        schools: "schools";
    }>;
    publicName: z.ZodString;
    testData: z.ZodBoolean;
    timestamp: z.ZodISODateTime;
}, z.core.$strip>;
declare const SchoolSchema: z.ZodObject<{
    archived: z.ZodBoolean;
    classes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    createdBy: z.ZodString;
    districtId: z.ZodString;
    id: z.ZodString;
    name: z.ZodString;
    normalizedName: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodString;
}, z.core.$strip>;
declare const CreateSchoolSchema: z.ZodObject<{
    name: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    districtId: z.ZodString;
    normalizedName: z.ZodString;
    type: z.ZodString;
}, z.core.$strip>;
declare const StatSchema: z.ZodObject<{
    assignment: z.ZodRecord<z.ZodString, z.ZodNumber>;
    survey: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, z.core.$strip>;
declare const UserClaimsSchema: z.ZodObject<{
    claims: z.ZodObject<{
        adminOrgs: z.ZodObject<{
            classes: z.ZodArray<z.ZodString>;
            districts: z.ZodArray<z.ZodString>;
            families: z.ZodArray<z.ZodString>;
            groups: z.ZodArray<z.ZodString>;
            schools: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        adminUid: z.ZodOptional<z.ZodString>;
        assessmentUid: z.ZodOptional<z.ZodString>;
        minimalAdminOrgs: z.ZodObject<{
            classes: z.ZodArray<z.ZodString>;
            districts: z.ZodArray<z.ZodString>;
            families: z.ZodArray<z.ZodString>;
            groups: z.ZodArray<z.ZodString>;
            schools: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        roarUid: z.ZodOptional<z.ZodString>;
        super_admin: z.ZodBoolean;
    }, z.core.$strip>;
    lastUpdated: z.ZodNumber;
    testData: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
declare const UserSchema: z.ZodObject<{
    adminData: z.ZodOptional<z.ZodObject<{
        administrationsCreated: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    assignments: z.ZodOptional<z.ZodObject<{
        assigned: z.ZodArray<z.ZodString>;
        completed: z.ZodArray<z.ZodString>;
        started: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    archived: z.ZodBoolean;
    assessmentUid: z.ZodString;
    classes: z.ZodObject<{
        all: z.ZodArray<z.ZodString>;
        current: z.ZodArray<z.ZodString>;
        dates: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
    }, z.core.$strip>;
    createdAt: z.ZodISODateTime;
    displayName: z.ZodString;
    districts: z.ZodObject<{
        all: z.ZodArray<z.ZodString>;
        current: z.ZodArray<z.ZodString>;
        dates: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
    }, z.core.$strip>;
    email: z.ZodString;
    groups: z.ZodObject<{
        all: z.ZodArray<z.ZodString>;
        current: z.ZodArray<z.ZodString>;
        dates: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
    }, z.core.$strip>;
    legal: z.ZodObject<{
        assent: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
        tos: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
    }, z.core.$strip>;
    schools: z.ZodObject<{
        all: z.ZodArray<z.ZodString>;
        current: z.ZodArray<z.ZodString>;
        dates: z.ZodRecord<z.ZodString, z.ZodISODateTime>;
    }, z.core.$strip>;
    sso: z.ZodOptional<z.ZodString>;
    userType: z.ZodEnum<{
        parent: "parent";
        admin: "admin";
        teacher: "teacher";
        student: "student";
    }>;
    testData: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
declare const OrgSchema: z.ZodObject<{
    archived: z.ZodBoolean;
    classes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    createdAt: z.ZodISODateTime;
    createdBy: z.ZodString;
    districtId: z.ZodString;
    id: z.ZodString;
    name: z.ZodString;
    normalizedName: z.ZodString;
    parentOrgId: z.ZodString;
    parentOrgType: z.ZodLiteral<"district">;
    schoolId: z.ZodString;
    schools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    subGroups: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    type: z.ZodString;
    updatedAt: z.ZodISODateTime;
}, z.core.$strip>;
declare const CreateOrgSchema: z.ZodObject<{
    name: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    districtId: z.ZodString;
    normalizedName: z.ZodString;
    schoolId: z.ZodString;
    type: z.ZodString;
    subGroups: z.ZodOptional<z.ZodArray<z.ZodString>>;
    parentOrgId: z.ZodString;
}, z.core.$strip>;
export { AdminDataSchema, AdministrationSchema, AssessmentConditionRuleSchema, AssessmentConditionsSchema, AssessmentSchema, AssignedOrgSchema, AssignmentAssessmentSchema, ClaimsSchema, ClassSchema, CreateClassSchema, CreateDistrictSchema, CreateGroupSchema, CreateOrgSchema, CreateSchoolSchema, DistrictSchema, GroupSchema, LegalInfoSchema, LegalSchema, OrgAssociationMapSchema, OrgRefMapSchema, OrgSchema, ReadOrgSchema, SchoolSchema, StatSchema, TimestampSchema, UserClaimsSchema, UserLegalSchema, UserSchema, };
export type AdminDataType = z.infer<typeof AdminDataSchema>;
export type AdministrationType = z.infer<typeof AdministrationSchema>;
export type AssessmentConditionRuleType = z.infer<typeof AssessmentConditionRuleSchema>;
export type AssessmentConditionsType = z.infer<typeof AssessmentConditionsSchema>;
export type AssessmentType = z.infer<typeof AssessmentSchema>;
export type AssignedOrgType = z.infer<typeof AssignedOrgSchema>;
export type AssignmentAssessmentType = z.infer<typeof AssignmentAssessmentSchema>;
export type ClaimsType = z.infer<typeof ClaimsSchema>;
export type ClassType = z.infer<typeof ClassSchema>;
export type CreateClassType = z.infer<typeof CreateClassSchema>;
export type CreateDistrictType = z.infer<typeof CreateDistrictSchema>;
export type CreateGroupType = z.infer<typeof CreateGroupSchema>;
export type CreateOrgType = z.infer<typeof CreateOrgSchema>;
export type CreateSchoolType = z.infer<typeof CreateSchoolSchema>;
export type DistrictType = z.infer<typeof DistrictSchema>;
export type GroupType = z.infer<typeof GroupSchema>;
export type LegalInfoType = z.infer<typeof LegalInfoSchema>;
export type LegalType = z.infer<typeof LegalSchema>;
export type OrgAssociationMapType = z.infer<typeof OrgAssociationMapSchema>;
export type OrgRefMapType = z.infer<typeof OrgRefMapSchema>;
export type OrgType = z.infer<typeof OrgSchema>;
export type ReadOrgType = z.infer<typeof ReadOrgSchema>;
export type SchoolType = z.infer<typeof SchoolSchema>;
export type StatType = z.infer<typeof StatSchema>;
export type TimestampType = z.infer<typeof TimestampSchema>;
export type UserClaimsType = z.infer<typeof UserClaimsSchema>;
export type UserLegalType = z.infer<typeof UserLegalSchema>;
export type UserType = z.infer<typeof UserSchema>;
//# sourceMappingURL=index.d.ts.map