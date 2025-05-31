import { useUser } from "@clerk/clerk-react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";
import split from "lodash/split.js";
import { PencilIcon } from "lucide-react";

import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { CreateQaModal } from "../../components/qa/create-qa-modal.tsx";
import { QaCopyButton } from "../../components/qa/qa-copy-button.tsx";
import { QaDeleteButton } from "../../components/qa/qa-delete-button.tsx";
import { UpdateQaModal } from "../../components/qa/update-qa-modal.tsx";
import { queryKeys } from "../../data/queries/queries.ts";
import { getQuestionAnswers } from "../../data/queries/question-answer.ts";
import { modalStore } from "../../global-stores/modal-store.ts";
import { SectionHeader } from "../../section-header.tsx";

const RouteComponent = () => {
  const { user } = useUser();
  const { data } = useQuery(getQuestionAnswers(user?.id));

  return (
    <MainLayout
      breadcrumbPaths={[
        { href: "/job-search", label: "Job Search" },
        { href: "/job-search/qa", label: "QA" },
      ]}
    >
      <SectionHeader
        header="Application Q/A"
        modalKey="createQa"
        modalLabel="Add Q/A"
        refreshKeys={queryKeys.allUserQuestionAnswers(user?.id)}
      />
      <Accordion isCompact variant="bordered">
        {map(data, (qa) => {
          return (
            <AccordionItem
              aria-label={qa.question}
              key={qa.id}
              title={qa.question}
            >
              <div>
                {map(split(qa.answer, "\n"), (line) => {
                  if (isEmpty(line)) {
                    return <br />;
                  }

                  return <div>{line}</div>;
                })}
              </div>
              <div className="flex justify-between gap-4 items-center">
                <div className="flex gap-2 mt-4 mb-2">
                  <QaCopyButton text={qa.answer} />
                  <Button
                    onPress={() => {
                      modalStore.setQaToUpdate(qa);
                      modalStore.openModal("updateQa");
                    }}
                    className="gap gap-2 items-center flex"
                  >
                    Edit <PencilIcon className="size-4" />
                  </Button>
                </div>
                <QaDeleteButton id={qa.id} />
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
      <CreateQaModal />
      <UpdateQaModal />
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search/qa")({
  component: RouteComponent,
});
