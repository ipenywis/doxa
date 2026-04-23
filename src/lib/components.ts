import Pre from "@/src/components/ui/pre";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Card, CardGrid } from "@/src/components/markdown/card";
import { File, FileTree, Folder } from "@/src/components/markdown/filetree";
import RoutedLink from "@/src/components/markdown/link";
import Mermaid from "@/src/components/markdown/mermaid";
import Note from "@/src/components/markdown/note";
import { Step, StepItem } from "@/src/components/markdown/step";

export const components = {
  a: RoutedLink,
  Card,
  CardGrid,
  FileTree,
  Folder,
  File,
  Mermaid,
  Note,
  pre: Pre,
  Step,
  StepItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
};
