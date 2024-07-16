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
import { URL_PREFIX, UserInfo } from "@/lib/type";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function DeleteUserDialog({
    children,
    userInfo
}: Readonly<{
    children: React.ReactNode;
    userInfo: UserInfo;
}>) {
    const { t } = useTranslation();

    async function handleDeleteUser(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const token = (form.elements.namedItem('token') as HTMLInputElement).value;
        if(token !== userInfo.config_sync_token){
            toast({
                variant: "destructive",
                title: t("deleteUser.tokenError"),
                description: t("deleteUser.tokenErrorDescription")
            })
            return;
        }
        await fetch(URL_PREFIX + "/api/1/user", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "Authorization": "Bearer "+userInfo.config_sync_token,
          }
        }).then(async res => {
          if (res.ok) {
            toast({
              title: t("deleteUser.deleteSuccess"),
              duration: 3000,
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
            location.reload();
          } else {
            throw new Error(t("deleteUser.deleteFail"));
          }
        }).catch(err => {
          toast({
            variant: "destructive",
            title: t("deleteUser.deleteFail"),
            description: err.message,
          })
        })
    }
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("deleteUser.title")}</DialogTitle>
                    <DialogDescription>
                        {t("deleteUser.description")}
                    </DialogDescription>
                </DialogHeader>
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t("deleteUser.alertTitle")}</AlertTitle>
                    <AlertDescription>
                    {t("deleteUser.alertDescription")}
                    </AlertDescription>
                </Alert>
                <form onSubmit={handleDeleteUser}>
                    <FloatingLabelInput id="token" type="password" label={t("deleteUser.tokenLabel")} defaultValue="" />
                    <Button type="submit" variant="destructive" className="mt-3 w-full">{t("deleteUser.deleteButtonText")}</Button>
                </form>
            </DialogContent>
        </Dialog>

    );
}