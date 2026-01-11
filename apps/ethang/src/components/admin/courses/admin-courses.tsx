import { useMutation, useQuery } from "@apollo/client/react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import { ArrowDown, ArrowUp, Pencil, Trash } from "lucide-react";
import { useState } from "react";

import {
  createCourse,
  deleteCourse,
  updateCourse,
} from "../../../graphql/mutations.ts";
import {
  type GetCourses,
  getCourses,
  type GetPaths,
  getPaths,
} from "../../../graphql/queries.ts";
import { TypographyH1 } from "../../typography/typography-h1.tsx";

export const AdminCourses = () => {
  const { data, loading, refetch } = useQuery<GetPaths>(getPaths);
  const {
    data: coursesData,
    loading: coursesLoading,
    refetch: refetchCourses,
  } = useQuery<GetCourses>(getCourses);
  const [doCreateCourse] = useMutation(createCourse);
  const [doUpdateCourse] = useMutation(updateCourse);
  const [doDeleteCourse] = useMutation(deleteCourse);

  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPathId, setNewPathId] = useState("");
  const [editingId, setEditingId] = useState<null | string>(null);

  const paths = get(data, ["paths"], []);
  const courses = get(coursesData, ["courses"], []);

  const handleCreate = async () => {
    if (null === editingId) {
      const pathCourses = filter(courses, (course) => {
        return get(course, ["path", "id"]) === newPathId;
      });

      await doCreateCourse({
        variables: {
          data: {
            name: newName,
            order: pathCourses.length,
            pathId: newPathId,
            url: newUrl,
          },
        },
      });
    } else {
      await doUpdateCourse({
        variables: {
          data: {
            name: newName,
            url: newUrl,
          },
          id: editingId,
        },
      });
      setEditingId(null);
    }

    setNewName("");
    setNewUrl("");
    await Promise.all([refetch(), refetchCourses()]);
  };

  const handleDelete = async (id: string) => {
    await doDeleteCourse({ variables: { id } });
    await Promise.all([refetch(), refetchCourses()]);
  };

  const handleMove = async (
    currentCourse: (typeof courses)[number],
    direction: "down" | "up",
  ) => {
    if (
      ("up" === direction && 1 === currentCourse.order) ||
      ("down" === direction && currentCourse.order === paths.length)
    ) {
      return;
    }

    const currentOrder = currentCourse.order;
    const otherOrder = currentOrder + ("up" === direction ? -1 : 1);
    const otherCourse = find(courses, { order: otherOrder });

    if (isNil(otherCourse)) {
      return;
    }

    // Set current to 0
    await doUpdateCourse({
      variables: {
        data: { order: 0 },
        id: currentCourse.id,
      },
    });
    // Set other to current order
    await doUpdateCourse({
      variables: {
        data: { order: currentOrder },
        id: otherCourse.id,
      },
    });
    // Set current to other order
    await doUpdateCourse({
      variables: {
        data: { order: otherOrder },
        id: currentCourse.id,
      },
    });

    await Promise.all([refetch(), refetchCourses()]);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <TypographyH1>Manage Courses</TypographyH1>

      <Card>
        <CardHeader>
          {null === editingId ? "Add New Course" : "Edit Course"}
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-row gap-2">
            <Select
              size="sm"
              label="Select Path"
              isDisabled={null !== editingId}
              selectedKeys={"" === newPathId ? [] : [newPathId]}
              onSelectionChange={(keys) => {
                // eslint-disable-next-line @typescript-eslint/no-misused-spread
                const [key] = [...keys];
                if (isString(key)) {
                  setNewPathId(key);
                }
              }}
            >
              {map(paths, (path) => (
                <SelectItem
                  key={get(path, ["id"])}
                  textValue={get(path, ["name"])}
                >
                  {get(path, ["name"])}
                </SelectItem>
              ))}
            </Select>
            <Input
              size="sm"
              label="Name"
              value={newName}
              onValueChange={setNewName}
            />
            <Input
              size="sm"
              label="URL"
              value={newUrl}
              onValueChange={setNewUrl}
            />
          </div>
          <div className="flex flex-row gap-2">
            <Button
              color="primary"
              isDisabled={"" === newPathId}
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
          </div>
        </CardBody>
      </Card>

      <Table aria-label="Courses table">
        <TableHeader>
          <TableColumn>ORDER</TableColumn>
          <TableColumn>PATH</TableColumn>
          <TableColumn>NAME</TableColumn>
          <TableColumn>URL</TableColumn>
          <TableColumn>ORDER</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent="No courses found"
          isLoading={loading || coursesLoading}
        >
          {map(courses, (course) => {
            const id = get(course, ["id"]);
            const name = get(course, ["name"]);
            const url = get(course, ["url"]);
            const order = get(course, ["order"]);
            const pathName = get(course, ["path", "name"]);

            return (
              <TableRow key={id}>
                <TableCell>{order}</TableCell>
                <TableCell>{pathName}</TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{url}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      isLoading={loading || coursesLoading}
                      onPress={() => {
                        handleMove(course, "up").catch(
                          globalThis.console.error,
                        );
                      }}
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      isLoading={loading || coursesLoading}
                      onPress={() => {
                        handleMove(course, "down").catch(
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
                      isLoading={loading || coursesLoading}
                      onPress={() => {
                        setEditingId(id);
                        setNewName(name);
                        setNewUrl(url);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      isIconOnly
                      color="danger"
                      variant="light"
                      isLoading={loading || coursesLoading}
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
