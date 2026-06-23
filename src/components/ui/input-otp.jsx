import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";
import { cn } from "@/lib/utils";
const InputOTPBase = React.forwardRef((props, ref) => {
  const { className, containerClassName, maxLength = 6, ...rest } = /** @type {any} */ (props);
  return (<OTPInput ref={ref} maxLength={maxLength} containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)} className={cn("disabled:cursor-not-allowed", className)} {...rest}/>);
});
const InputOTP = /** @type {any} */ (InputOTPBase);
InputOTP.displayName = "InputOTP";
const InputOTPGroupBase = React.forwardRef((props, ref) => {
  const { className, ...rest } = /** @type {any} */ (props);
  return (<div ref={ref} className={cn("flex items-center", className)} {...rest}/>);
});
const InputOTPGroup = /** @type {any} */ (InputOTPGroupBase);
InputOTPGroup.displayName = "InputOTPGroup";
const InputOTPSlotBase = React.forwardRef((props, ref) => {
  const { index, className, ...rest } = /** @type {any} */ (props);
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
    return ((<div ref={ref} className={cn("relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md", isActive && "z-10 ring-1 ring-ring", className)} {...rest}>
      {char}
      {hasFakeCaret && (<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000"/>
        </div>)}
    </div>));
});
const InputOTPSlot = /** @type {any} */ (InputOTPSlotBase);
InputOTPSlot.displayName = "InputOTPSlot";
const InputOTPSeparatorBase = React.forwardRef((props, ref) => (<div ref={ref} role="separator" {...(/** @type {any} */ (props))}>
    <Minus />
  </div>));
const InputOTPSeparator = /** @type {any} */ (InputOTPSeparatorBase);
InputOTPSeparator.displayName = "InputOTPSeparator";
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
