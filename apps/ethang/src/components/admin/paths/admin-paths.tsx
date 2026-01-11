import { useMutation, useQuery } from "@apollo/client/react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import find from "lodash/find";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { ArrowDown, ArrowUp, Pencil, Trash } from "lucide-react";
import { useState } from "react";

import {
  createPath,
  deletePath,
  updatePath,
} from "../../../graphql/mutations.ts";
import { type GetPaths, getPaths } from "../../../graphql/queries.ts";
import { TypographyH1 } from "../../typography/typography-h1.tsx";

export const AdminPaths = () => {
  const { data, loading, refetch } = useQuery<GetPaths>(getPaths);
  const [doCreatePath] = useMutation(createPath);
  const [doUpdatePath] = useMutation(updatePath);
  const [doDeletePath] = useMutation(deletePath);

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<null | string>(null);

  const paths = get(data, ["paths"], []);

  const handleCreate = async () => {
    if (null === editingId) {
      await doCreatePath({
        variables: {
          data: {
            name: newName,
            order: paths.length + 1,
            url: "" === newUrl ? null : newUrl,
          },
        },
      });
    } else {
      await doUpdatePath({
        variables: {
          data: {
            name: newName,
            url: "" === newUrl ? null : newUrl,
          },
          id: editingId,
        },
      });
      setEditingId(null);
    }

    setNewName("");
    setNewUrl("");
    await refetch();
  };

  const handleDelete = async (id: string) => {
    await doDeletePath({ variables: { id } });
    await refetch();
  };

  const handleMove = async (
    currentPath: (typeof paths)[number],
    direction: "down" | "up",
  ) => {
    if (
      ("up" === direction && 1 === currentPath.order) ||
      ("down" === direction && currentPath.order === paths.length)
    ) {
      return;
    }

    const currentOrder = currentPath.order;
    const otherOrder = currentOrder + ("up" === direction ? -1 : 1);
    const otherPath = find(paths, { order: otherOrder });

    if (isNil(otherPath)) {
      return;
    }

    // Set current to 0
    await doUpdatePath({
      variables: { data: { order: 0 }, id: currentPath.id },
    });
    // Set other to current order
    await doUpdatePath({
      variables: { data: { order: currentOrder }, id: get(otherPath, ["id"]) },
    });
    // Set current to other order
    await doUpdatePath({
      variables: { data: { order: otherOrder }, id: currentPath.id },
    });

    await refetch();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <TypographyH1>Manage Paths</TypographyH1>

      <Card>
        <CardHeader>
          {null === editingId ? "Add New Path" : "Edit Path"}
        </CardHeader>
        <CardBody className="flex flex-row gap-2">
          <Input
            size="sm"
            label="Name"
            value={newName}
            onValueChange={setNewName}
          />
          <Input
            size="sm"
            value={newUrl}
            label="URL (Optional)"
            onValueChange={setNewUrl}
          />
          <Button
            color="primary"
            onPress={() => {
              handleCreate().catch(globalThis.console.error);
            }}
          >
            {null === editingId ? "Add" : "Update"}
          </Button>
          {null !== editingId && (
            <Button
              onPress={() => {
                setEditingId(null);
                setNewName("");
                setNewUrl("");
              }}
            >
              Cancel
            </Button>
          )}
        </CardBody>
      </Card>

      <Table aria-label="Paths table">
        <TableHeader>
          <TableColumn>ORDER</TableColumn>
          <TableColumn>NAME</TableColumn>
          <TableColumn>URL</TableColumn>
          <TableColumn>ORDER</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading}>
          {map(paths, (path) => {
            const id = get(path, ["id"]);
            const name = get(path, ["name"]);
            const url = get(path, ["url"], "");
            const order = get(path, ["order"]);

            return (
              <TableRow key={id}>
                <TableCell>{order}</TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{"" === url ? "N/A" : url}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      onPress={() => {
                        handleMove(path, "up").catch(globalThis.console.error);
                      }}
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      onPress={() => {
                        handleMove(path, "down").catch(
                          globalThis.console.error,
                        );
                      }}
                    >
                      <ArrowDown size={16} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      onPress={() => {
                        setEditingId(id);
                        setNewName(get(path, ["name"]));
                        setNewUrl(get(path, ["url"], "") ?? "");
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      color="danger"
                      variant="light"
                      onPress={() => {
                        handleDelete(id).catch(globalThis.console.error);
                      }}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
