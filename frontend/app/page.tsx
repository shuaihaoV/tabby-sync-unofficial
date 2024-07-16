"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DisplayChanger from "@/components/DisplayChanger";
import LanguageChanger from "@/i18n/LanguageChanger";
import {
  useTranslation
} from "next-export-i18n";
import { FloatingLabelInput } from '@/components/ui/float-label-input';
import { Button } from '@/components/ui/button';
import { FormEvent, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { URL_PREFIX, UserInfo } from '@/lib/type';
import { LogOut, RotateCcw } from 'lucide-react';
import CreateUserDialog from './components/CreateUserDialog';
import ExportConfigsDialog from './components/ExportConfigsDialog';
import ImportConfigsDialog from './components/ImportConfigsDialog';
import DeleteUserDialog from './components/DeleteUserDialog';
import RotateTokenDialog from './components/RotateTokenDialog';
import ConfigsTable from './components/ConfigsTable';


export default function Home() {
  const { t } = useTranslation();
  const [userinfo, setUserinfo] = useState<UserInfo>();
  const [refreshKey, setRefreshKey] = useState(0);
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = (form.elements.namedItem('token') as HTMLInputElement).value;
    await fetch(URL_PREFIX + "/api/1/user", {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "Authorization": "Bearer " + token
      }
    }).then(async res => {
      const res_json = await res.json();
      if (res.ok) {
        const userinfo_data = res_json as UserInfo;
        toast({
          title: t("login.loginSuccess"),
        })
        setUserinfo(userinfo_data);
      } else {
        throw new Error(res_json.detail)
      }
    }).catch(err => {
      toast({
        variant: "destructive",
        title: t("login.loginFail"),
        description: err.message,
      })
    })

  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {
        userinfo === undefined && <Card className='min-w-[350px] w-[35%] h-full'>
          <CardHeader>
            <CardTitle className="flex">
              <div className="leading-10">{t("login.title")}</div>
              <div className='ml-auto flex space-x-4'>
                <LanguageChanger />
                <DisplayChanger />
              </div>
            </CardTitle>
            <CardDescription>{t("login.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <FloatingLabelInput id="token" type="password" label={t("login.tokenLabel")} className='mt-2' defaultValue="" />
              <Button type="submit" className='w-full mt-3'>{t("login.submitButtonText")}</Button>
            </form>
            <CreateUserDialog>
              <Button variant="link" className='w-full mt-3'>{t("createUser.createAccountButtonText")}</Button>
            </CreateUserDialog>
          </CardContent>
          <CardFooter className='flex justify-center mt-3'>
            2024 @Shuaihao
            <a
              href="https://github.com/shuaihaoV/tabby-sync-unofficial"
              className="pl-2 font-medium text-primary underline underline-offset-4 top-2"
              target="_blank"
              rel="noreferrer"
            >Github</a>
          </CardFooter>
        </Card>
      }
      {
        userinfo !== undefined && <Card className='min-w-[370px] w-[65%] h-full'>
          <CardHeader>
            <CardTitle className="flex">
              <div className="leading-10">{t("dashbord.title")}   {userinfo.username}</div>
              <div className='ml-auto flex space-x-2'>
                <Button variant="outline" size="icon" onClick={() => setRefreshKey(prevKey => prevKey + 1)}>
                  <RotateCcw />
                </Button>
                <LanguageChanger />
                <DisplayChanger />
                <Button variant="outline" size="icon" onClick={() => setUserinfo(undefined)}>
                  <LogOut />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>{t("dashbord.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Button Group */}
            <div className="flex flex-wrap justify-center items-center">
              <div className="w-1/2 md:w-1/4 p-2 flex justify-center items-center">
                <ImportConfigsDialog userInfo={userinfo}>
                  <Button >
                    {t("importConfigs.importButtonText")}
                  </Button>
                </ImportConfigsDialog>
              </div>
              <div className="w-1/2 md:w-1/4 p-2 flex justify-center items-center">
                <ExportConfigsDialog userInfo={userinfo}>
                  <Button >
                    {t("exportConfigs.exportButtonText")}
                  </Button>
                </ExportConfigsDialog>
              </div>
              <div className="w-1/2 md:w-1/4 p-2 flex justify-center items-center">
                <DeleteUserDialog userInfo={userinfo}>
                  <Button variant="destructive">
                    {t("deleteUser.deleteButtonText")}
                  </Button>
                </DeleteUserDialog>
              </div>
              <div className="w-1/2 md:w-1/4 p-2 flex justify-center items-center">
                <RotateTokenDialog userInfo={userinfo}>
                  <Button variant="destructive">
                  {t("rotateToken.rotateButtonText")}
                  </Button>
                </RotateTokenDialog>
              </div>
            </div>

            {/* Table */}
            <ConfigsTable userInfo={userinfo} key={`config-table-${refreshKey}`} />
          </CardContent>
          <CardFooter className='flex justify-center mt-3'>
            2024 @Shuaihao
            <a
              href="https://github.com/shuaihaoV/tabby-sync-unofficial"
              className="pl-2 font-medium text-primary underline underline-offset-4 top-2"
              target="_blank"
              rel="noreferrer"
            >Github</a>
          </CardFooter>
        </Card>
      }
    </main>
  );
}
