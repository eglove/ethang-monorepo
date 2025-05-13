import { Accordion, AccordionItem } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map";

import { QaItem } from "@/components/qa/qa-item.tsx";
import { getQas } from "@/data/methods/get-qas.ts";

export const QaList = () => {
  const qas = useQuery(getQas());

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
