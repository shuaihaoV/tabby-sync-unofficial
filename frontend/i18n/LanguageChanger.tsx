'use client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    LanguageSwitcher,
} from "next-export-i18n";
export default function LanguageChanger() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline" size="icon">
                    <Languages />
                </Button>

            </DropdownMenuTrigger>
            <DropdownMenuContent >
                <LanguageSwitcher lang="en" asChild>
                    <DropdownMenuItem>
                        English
                    </DropdownMenuItem>
                </LanguageSwitcher>
                <LanguageSwitcher lang="zh" asChild>
                    <DropdownMenuItem>
                        简体中文
                    </DropdownMenuItem>
                </LanguageSwitcher>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}