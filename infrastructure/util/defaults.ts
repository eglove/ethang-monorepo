import { ec2 } from "@pulumi/aws";

export const getDefaultVpc = async () => {
  return ec2.getVpc({ default: true });
};

export const getDefaultSubnets = async () => {
  const vpc = await getDefaultVpc();

  return ec2.getSubnets({
    filters: [{
      name: "vpc-id",
      values: [vpc.id],
    }],
  }).then((subnets) => {
    return subnets.ids;
  });
};
