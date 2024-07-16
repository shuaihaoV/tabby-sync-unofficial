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

export default function CreateUserDialog({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { t } = useTranslation();
    const [newToken, setNewToken] = useState<string>("");

    async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const username = (form.elements.namedItem('username') as HTMLInputElement).value;
        await fetch(URL_PREFIX + "/api/1/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            username: username,
          }),
        }).then(async res => {
          if (res.ok) {
            const res_json = await res.json();
            const token = res_json.token;
            setNewToken(token);
            toast({
              title: t("createUser.createAccountSuccess"),
              duration: 3000,
            })
          } else {
            throw new Error(await res.text());
          }
        }).catch(err => {
          toast({
            variant: "destructive",
            title: t("createUser.createAccountError"),
            description: err.message,
          })
        })
    }
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("createUser.title")}</DialogTitle>
                    <DialogDescription>
                        {t("createUser.description")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser}>
                    <FloatingLabelInput id="username" name="username" label={t("createUser.usernameLabel")} readOnly={newToken.length>0}/>
                    {newToken.length>0 &&
                        <FloatingLabelInput id="token" name="token" label={t("createUser.tokenLabel")} value={newToken} readOnly={true} className="mt-3"/>
                    }
                    <Button type="submit" className="mt-3 w-full" disabled={newToken.length>0}>{t("createUser.submitButtonText")}</Button>
                </form>
            </DialogContent>
        </Dialog>

    );
}