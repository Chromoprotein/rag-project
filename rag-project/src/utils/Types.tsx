import { ReactNode } from "react";
import { ChangeEventHandler } from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ButtonProps = {
    func?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    children: ReactNode;
    isDisabled?: Boolean;
}

export type TextareaProps = {
  val: string;
  func: ChangeEventHandler<HTMLTextAreaElement>;
  plac: string;
}

export type BoxProps = {
  children: ReactNode;
}

export type FormProps = {
  children: ReactNode;
  func: (e: React.FormEvent<Element>) => Promise<void>;
}

export type DropdownProps = {
  func: React.ChangeEventHandler<HTMLSelectElement>;
  val: string;
  options: string[];
}

export type Fact = {
  id: string;
  text: string;
  category: string;
}

export type Style = {
    pov: string,
    tense: string,
    style: string,
};