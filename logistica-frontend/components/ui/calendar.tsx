"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        today: "!text-accent-foreground",
        selected: "!bg-primary !text-primary-foreground !rounded-md",
        range_end: "!rounded-r-md",
        range_middle: "!bg-primary/10 !text-foreground",
        range_start: "!rounded-l-md",
        outside: "!text-muted-foreground/50",
        disabled: "!text-muted-foreground/30",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
