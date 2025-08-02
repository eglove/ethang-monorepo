import { useQuery } from "@apollo/client";
import { Accordion, AccordionItem, Button } from "@heroui/react";
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
import {
  type GetAllQuestionAnswers,
  getAllQuestionAnswers,
} from "../../graphql/queries/get-all-question-answers.ts";
import { SectionHeader } from "../../section-header.tsx";
import { qaStore } from "../../stores/qa-store.ts";

const RouteComponent = () => {
  const { data } = useQuery<GetAllQuestionAnswers>(getAllQuestionAnswers);

  return (
    <MainLayout
      breadcrumbPaths={[
        { href: "/job-search", label: "Job Search" },
        { href: "/job-search/qa", label: "QA" },
      ]}
    >
      <SectionHeader
        openModal={() => {
          qaStore.setIsCreateModalOpen(true);
        }}
        header="Application Q/A"
        modalLabel="Add Q/A"
      />
      <Accordion isCompact variant="bordered">
        {map(data?.questionAnswers, (qa) => {
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
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="mt-4 mb-2 flex gap-2">
                  <QaCopyButton text={qa.answer} />
                  <Button
                    onPress={() => {
                      qaStore.setQaToUpdate(qa);
                      qaStore.setIsUpdateModalOpen(true);
                    }}
                    className="gap flex items-center gap-2"
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
