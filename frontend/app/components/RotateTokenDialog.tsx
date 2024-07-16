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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react";

export default function RotateTokenDialog({
    children,
    userInfo
}: Readonly<{
    children: React.ReactNode;
    userInfo: UserInfo;
}>) {
    const { t } = useTranslation();
    const [loadding, setLoadding] = useState(false);
    const [newToken, setNewToken] = useState("");
    async function handleRotateToken(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const token = (form.elements.namedItem('token') as HTMLInputElement).value;
        if (token !== userInfo.config_sync_token) {
            toast({
                variant: "destructive",
                title: t("rotateToken.tokenError"),
                description: t("rotateToken.tokenErrorDescription")
            })
            return;
        }
        setLoadding(true);
        // Backup configs
        const configs_list = await fetch(URL_PREFIX + "/api/1/configs", {
            method: "GET",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + userInfo.config_sync_token
            }
        }).then(async res => {
            const configs_list = await res.json() as ConfigInfo[];
            if (res.ok) {
                const data = JSON.stringify(configs_list);
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'tabby-sync-configs.json';
                link.click();
                toast({
                    title: t("rotateToken.backupConfigsSuccess"),
                    duration: 3000,
                })
                return configs_list;
            } else {
                throw new Error(t("rotateToken.backupConfigsFail"));
            }
        }).catch(err => {
            toast({
                variant: "destructive",
                title: t("rotateToken.backupConfigsFail"),
                description: err.message,
            })
        });
        if (!configs_list) {
            setLoadding(false);
            return;
        }
        // Patch User Token
        const new_token_data = await fetch(URL_PREFIX + "/api/1/user", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Accept": "application/json",
                "Authorization": "Bearer " + userInfo.config_sync_token
            }
        }).then(async res => {
            if (res.ok) {
                const userInfo = await res.json() as UserInfo;
                toast({
                    title: t("rotateToken.patchUserSuccess"),
                    duration: 3000,
                });
                return userInfo.config_sync_token;
            } else {
                throw new Error(t("rotateToken.patchUserFail"));
            }
        }).catch(err => {
            toast({
                variant: "destructive",
                title: t("rotateToken.patchUserFail"),
                description: err.message,
            })
            return "";
        });
        if (new_token_data.length === 0) {
            setLoadding(false);
            return;
        }
        setNewToken(new_token_data);
        // Patch Configs
        for (const config of configs_list) {
            const patch_result = await fetch(URL_PREFIX + "/api/1/configs/" + config.id, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Authorization": "Bearer " + new_token_data
                },
                body: JSON.stringify({
                    content: config.content,
                    last_used_with_version: config.last_used_with_version ?? ""
                })
            }).then(async res => {
                if (!res.ok) {
                    throw new Error(t("rotateToken.patchConfigFail"));
                }
                return true;
            }).catch(err => {
                toast({
                    variant: "destructive",
                    title: t("rotateToken.patchConfigFail"),
                    description: err.message,
                });
                return false;
            });
            if (!patch_result) {
                toast({
                    title: t("rotateToken.rotateFail"),
                    description: config.name,
                    duration: 3000,
                });
                break;
            }
        }
        toast({
            title: t("rotateToken.rotateSuccess"),
            duration: 3000,
        })
        setLoadding(false);
    }
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("rotateToken.title")}</DialogTitle>
                    <DialogDescription>
                        {t("rotateToken.description")}
                    </DialogDescription>
                </DialogHeader>
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t("rotateToken.alertTitle")}</AlertTitle>
                    <AlertDescription>
                    {t("rotateToken.alertDescription")}
                    </AlertDescription>
                </Alert>
                <form onSubmit={handleRotateToken}>
                    <FloatingLabelInput id="token" type="password" label={t("rotateToken.oldTokenLabel")} defaultValue="" />
                    {newToken.length > 0 &&
                        <FloatingLabelInput id="newToken" name="newToken" label={t("rotateToken.newTokenLabel")} value={newToken} readOnly={true} className="mt-3" defaultValue="" />
                    }
                    <Button type="submit" className="mt-3 w-full" disabled={loadding}>{t("rotateToken.rotateButtonText")}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}