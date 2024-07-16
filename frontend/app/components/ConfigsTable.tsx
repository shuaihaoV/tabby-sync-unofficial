import {
    ColumnDef, ColumnFiltersState, SortingState, useReactTable, VisibilityState, getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { URL_PREFIX, UserInfo, ConfigInfo } from "@/lib/type";
import { SyntheticEvent, useEffect, useState } from "react";
import { useTranslation } from "next-export-i18n";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { toast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { convertUTCToLocalTime } from "@/lib/utils";

export default function ConfigsTable({
    userInfo
}: Readonly<{
    userInfo: UserInfo;
}>) {
    const { t } = useTranslation();
    const [configList, setConfigList] = useState<ConfigInfo[]>([]);
    const [viewConfig, setViewConfig] = useState<ConfigInfo>();
    const [sorting, setSorting] = useState<SortingState>([{ id: "id", desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const config_column: ColumnDef<ConfigInfo>[] = [
        {
            enableHiding: true,
            accessorKey: "id",
            header: t("configTable.header.id"),
            cell: ({ row }) => (
                <div>{row.original.id}</div>
            ),
        },
        {
            enableHiding: false,
            accessorKey: "name",
            header: t("configTable.header.name"),
            cell: ({ row }) => (
                <div>{row.original.name}</div>
            ),
        },
        {
            enableHiding: false,
            accessorKey: "last_used_with_version",
            header: t("configTable.header.last_used_with_version"),
            cell: ({ row }) => (
                <div>{row.original.last_used_with_version}</div>
            ),
        },
        {
            enableHiding: false,
            accessorKey: "created_at",
            header: t("configTable.header.created_at"),
            cell: ({ row }) => (
                <div>{convertUTCToLocalTime(row.original.created_at)}</div>
            ),
        },
        {
            enableHiding: false,
            accessorKey: "modified_at",
            header: t("configTable.header.modified_at"),
            cell: ({ row }) => (
                <div>{convertUTCToLocalTime(row.original.modified_at)}</div>
            ),
        },
    ]

    const table = useReactTable<ConfigInfo>({
        data: configList,
        columns: config_column,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    async function handleGetConfigs() {
        await fetch(URL_PREFIX + "/api/1/configs", {
            method: "GET",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + userInfo.config_sync_token
            }
        }).then(async res => {
            const res_json = await res.json();
            if (res.ok) {
                setConfigList(res_json as ConfigInfo[]);
                toast({
                    title: t("configTable.getConfigs.getConfigsSuccess"),
                    duration: 3000,
                })
            } else {
                throw new Error(res_json);
            }
        }).catch(err => {
            toast({
                variant: "destructive",
                title: t("configTable.getConfigs.getConfigsFail"),
                description: err.message,
            })
        })
    }

    async function handleViewConfig(id: number) {

    }

    async function handleDownloadConfig(id: number) {
        await fetch(URL_PREFIX + "/api/1/configs/" + id, {
            method: "GET",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + userInfo.config_sync_token
            }
        }).then(async res => {
            const res_json = await res.json();
            if (res.ok) {
                const blob = new Blob([res_json.content], { type: "application/x-yaml" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'config.yaml';
                link.click();
                toast({
                    title: t("configTable.downloadConfigs.downloadConfigsSuccess"),
                    duration: 3000,
                })
            } else {
                throw new Error(res_json);
            }
        }).catch(err => {
            toast({
                variant: "destructive",
                title: t("configTable.downloadConfigs.downloadConfigsFail"),
                description: err.message,
            })
        })
    }

    async function handleDeleteConfig(id: number) {
        await fetch(URL_PREFIX + "/api/1/configs/" + id, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + userInfo.config_sync_token
            }
        }).then(async res => {
            if (res.ok) {
                setConfigList((prevState) => prevState.filter(item => item.id !== id));
                toast({
                    title: t("configTable.deleteConfigs.deleteConfigsSuccess"),
                    duration: 3000,
                })
            } else {
                throw new Error(t("configTable.deleteConfigs.deleteConfigsFail"));
            }
        }).catch(err => {
            toast({
                variant: "destructive",
                title: t("configTable.deleteConfigs.deleteConfigsFail"),
                description: err.message,
            })
        })
    }

    useEffect(() => {
        let isMounted = true;
        if (isMounted) {
            handleGetConfigs();
        }
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <Table className="h-full w-full">
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id + "_header_row"}>
                        {headerGroup.headers.map((header) => {
                            return (
                                <TableHead key={header.id + "_header"}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            )
                        })}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <ContextMenu key={row.id}>
                            <ContextMenuTrigger asChild>
                                <TableRow
                                    key={row.id}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem onClick={() => setViewConfig(row.original)}>{t("configTable.viewConfigTitle")}</ContextMenuItem>
                                <ContextMenuItem onClick={() => handleDownloadConfig(row.original.id)}>{t("configTable.downloadConfigsTitle")}</ContextMenuItem>
                                <ContextMenuItem onClick={() => handleDeleteConfig(row.original.id)}>{t("configTable.deleteConfigsTitle")}</ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    ))
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={config_column.length}
                            className="h-24 text-center"
                        >
                            {t("configTable.noData")}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            <Dialog 
                open={viewConfig!==undefined} 
                onOpenChange={(open)=>{setViewConfig(undefined)}}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("configTable.viewConfigTitle")} : {viewConfig?.name}</DialogTitle>
                        <DialogDescription>

                        </DialogDescription>
                    </DialogHeader>
                    <AutosizeTextarea
                            value={viewConfig?.content}
                            maxHeight={400}
                            className="h-full w-full resize-none bg-transparent"
                            readOnly={true}
                        />
                </DialogContent>
            </Dialog>

        </Table>
    );
}