import { QaItem } from "@/components/qa/qa-item.tsx";
import { TypographyLead } from "@/components/typography/typography-lead.tsx";
import { queries } from "@/data/queries.ts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map";

export const QaList = () => {
  const qas = useQuery(queries.getQas());

  return (
    <>
      {map(qas.data, (qa) => {
        return (
          <Card className="my-4" key={qa.id}>
            <CardHeader>
              <TypographyLead>{qa.question}</TypographyLead>
            </CardHeader>
            <CardBody>
              <QaItem qa={qa} />
            </CardBody>
          </Card>
        );
      })}
    </>
  );
};
