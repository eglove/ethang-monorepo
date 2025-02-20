import { QaItem } from "@/components/qa/qa-item.tsx";
import { queries } from "@/data/queries.ts";
import { Accordion, AccordionItem } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map";

export const QaList = () => {
  const qas = useQuery(queries.getQas());

  return (
    <Accordion>
      {map(qas.data, (qa) => {
        return (
          <AccordionItem
            aria-label={qa.question}
            key={qa.id}
            title={qa.question}
          >
            <QaItem key={qa.id} qa={qa} />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
