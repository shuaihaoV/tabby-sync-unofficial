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
import { Button } from "@/components/ui/button";
import { URL_PREFIX, UserInfo } from "@/lib/type";
import { toast } from "@/components/ui/use-toast";

export default function ExportConfigsDialog({
    children,
    userInfo
}: Readonly<{
    children: React.ReactNode;
    userInfo: UserInfo;
}>) {
    const { t } = useTranslation();
    async function handleExportConfigs(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
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
                const data = JSON.stringify(res_json);
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'tabby-sync-configs.json';
                link.click();
                toast({
                    title: t("exportConfigs.exportSuccess"),
                    duration: 3000,
                })
            } else {
                throw new Error(res_json);
            }
        }).catch(err => {
            toast({
                variant: "destructive",
                title: t("exportConfigs.exportFail"),
                description: err.message,
            })
        })
    }
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("exportConfigs.title")}</DialogTitle>
                    <DialogDescription>
                        {t("exportConfigs.description")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleExportConfigs}>
                    <Button type="submit" className="mt-3 w-full">{t("exportConfigs.exportButtonText")}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}