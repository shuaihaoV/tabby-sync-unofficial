import { useTranslation } from "next-export-i18n";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FormEvent, useState } from "react";
import { FloatingLabelInput } from "@/components/ui/float-label-input";
import { Button } from "@/components/ui/button";
import { ConfigInfo, URL_PREFIX, UserInfo } from "@/lib/type";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
    FileUploader,
    FileUploaderContent,
    FileUploaderItem,
    FileInput,
} from "@/components/ui/file-uploader";
import { Paperclip } from "lucide-react";

export default function ImportConfigsDialog({
    children,
    userInfo
}: Readonly<{
    children: React.ReactNode;
    userInfo: UserInfo;
}>) {
    const { t } = useTranslation();
    const [files, setFiles] = useState<File[] |null>([]);
    const dropZoneConfig = {
        maxFiles: 1,
        maxSize: 1024 * 1024 * 256,
        multiple: true,
    };
    async function handleImportConfigs(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (files === null ||files.length < 1) {
            toast({
                variant: "destructive",
                title: t("importConfigs.fileNotSelected"),
                duration:3000
            })
            return;
        }
        for (let file of files) {
            let configs_list: ConfigInfo[];
            try {
                configs_list = JSON.parse(await file.text()) as ConfigInfo[];
            } catch (e: any) {
                toast({
                    variant: "destructive",
                    title: t("importConfigs.contentFormatError"),
                    description: e.message
                })
                break;
            }
            for (let config of configs_list) {
                const configCreateResult: ConfigInfo = await fetch(`${URL_PREFIX}/api/1/configs`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + userInfo.config_sync_token
                    },
                    body: JSON.stringify({
                        name: config.name,
                    }),
                }).then(res => res.json()).catch(e => {
                    toast({
                        variant: "destructive",
                        title: t("importConfigs.configCreateError"),
                        description: e.message,
                    })
                });
                const configContentCreateResult: ConfigInfo = await fetch(`${URL_PREFIX}/api/1/configs/${configCreateResult.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + userInfo.config_sync_token
                    },
                    body: JSON.stringify({
                        content: config.content,
                        last_used_with_version:config.last_used_with_version??""
                    }),
                }).then(res => res.json()).catch(e => {
                    toast({
                        title: t("importConfigs.configContentCreateError"),
                        variant: "destructive",
                    })
                });
            }
        }
        toast({
            title: t("importConfigs.importSuccess"),
            duration:3000
        });
    }

    const FileSvgDraw = () => {
        return (
            <>
                <svg
                    className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                >
                    <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                </svg>
                <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{t("importConfigs.fileUploaderTips")}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    *.json
                </p>
            </>
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("importConfigs.title")}</DialogTitle>
                    <DialogDescription>
                        {t("importConfigs.description")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleImportConfigs}>
                    <FileUploader
                        value={files}
                        onValueChange={setFiles}
                        dropzoneOptions={dropZoneConfig}
                        reSelect={true}
                        className="relative bg-background rounded-lg p-2"
                    >
                        <FileInput className="outline-dashed outline-1 outline-white">
                            <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full ">
                                <FileSvgDraw />
                            </div>
                        </FileInput>
                        <FileUploaderContent>
                            {files &&
                                files.length > 0 &&
                                files.map((file, i) => (
                                    <FileUploaderItem key={i} index={i}>
                                        <Paperclip className="h-4 w-4 stroke-current" />
                                        <span>{file.name}</span>
                                    </FileUploaderItem>
                                ))}
                        </FileUploaderContent>
                    </FileUploader>

                    <Button type="submit" disabled={files?.length === 0} className="mt-3 w-full">{t("importConfigs.importButtonText")}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}