import { useUser } from "@clerk/clerk-react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map.js";
import { PencilIcon, PlusIcon } from "lucide-react";

import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { QaCopyButton } from "../../components/qa/qa-copy-button.tsx";
import { getQuestionAnswers } from "../../data/queries/question-answer.ts";
import { modalStore } from "../../global-stores/modal-store.ts";

const RouteComponent = () => {
  const { user } = useUser();
  const { data } = useQuery(getQuestionAnswers(user?.id));

  return (
    <MainLayout>
      <div className="flex justify-between items-center my-4">
        <div className="prose">
          <h2 className="text-foreground">Application Q/A</h2>
        </div>
        <Button
          isIconOnly
          onPress={() => {
            modalStore.openModal("createQa");
          }}
          aria-label="Add Q/A"
          color="primary"
          size="sm"
        >
          <PlusIcon />
        </Button>
      </div>
      <Accordion isCompact variant="bordered">
        {map(data, (qa) => {
          return (
            <AccordionItem
              aria-label={qa.question}
              key={qa.id}
              title={qa.question}
            >
              <div>{qa.answer}</div>
              <div className="flex gap-2 mt-4 mb-2">
                <QaCopyButton text={qa.answer} />
                <Button className="gap gap-2 items-center flex">
                  Edit <PencilIcon className="size-4" />
                </Button>
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search/qa")({
  component: RouteComponent,
});
