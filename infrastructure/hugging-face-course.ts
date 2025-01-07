import { iam, sagemaker } from "@pulumi/aws";

import { getDefaultSubnets, getDefaultVpc } from "./util/defaults";

const userName = "hugging-face-course1-user";

// Create IAM User
const iamUser = new iam.User(userName, {
  name: userName,
  permissionsBoundary: undefined,
});

const adminPolicyAttachment = new iam.UserPolicyAttachment(`${userName}-admin-policy`, {
  policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
  user: iamUser.name,
});

const loginProfile = new iam.UserLoginProfile(`${userName}-login-profile`, {
  passwordResetRequired: false,
  user: iamUser.name,
});

// Setup sagemaker domain
const sagemakerExecutionRole = new iam.Role("sagemakerExecutionRole", {
  assumeRolePolicy: iam.assumeRolePolicyForPrincipal({
    Service: "sagemaker.amazonaws.com",
  }),
});

new iam.RolePolicyAttachment("sagemakerRoleAttachment", {
  policyArn: "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess",
  role: sagemakerExecutionRole.name,
});

const setupSagemaker = async () => {
  const defaultVpc = await getDefaultVpc();
  const defaultSubnets = await getDefaultSubnets();

  const sagemakerDomain = new sagemaker.Domain("sagemakerDomain", {
    appNetworkAccessType: "PublicInternetOnly",
    authMode: "IAM",
    defaultSpaceSettings: {
      executionRole: sagemakerExecutionRole.arn,
    },
    defaultUserSettings: {
      executionRole: sagemakerExecutionRole.arn,
      jupyterLabAppSettings: {
        defaultResourceSpec: {
          instanceType: "ml.t3.medium",
          lifecycleConfigArn: undefined,
        },
      },
    },
    domainName: "huggingFaceDomain",
    subnetIds: defaultSubnets,
    vpcId: defaultVpc.id,
  });

  const userProfile = new sagemaker.UserProfile(`${userName}-profile`, {
    domainId: sagemakerDomain.id,
    userProfileName: userName,
    userSettings: {
      executionRole: sagemakerExecutionRole.arn,
    },
  });

  const studioSpace = new sagemaker.Space("huggingFaceStudioSpace", {
    domainId: sagemakerDomain.id,
    spaceName: "hugging-face-jupyter-space",
  });

  return {
    sagemakerDomain,
    studioSpace,
    userProfile,
  };
};

setupSagemaker().catch(globalThis.console.error);

export const huggingFaceCourse = {
  username: iamUser.name,
};
