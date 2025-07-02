import { IBpNumber } from "../../dataType";
import { IBpBuiltinFunction } from "../../function";

export namespace BpMath {
    const PI: IBpBuiltinFunction<'PI', [], IBpNumber>;
    const abs: IBpBuiltinFunction<'abs', [IBpNumber], IBpNumber>;
    const min: IBpBuiltinFunction<'min', [IBpNumber, IBpNumber], IBpNumber>;
    const max: IBpBuiltinFunction<'max', [IBpNumber, IBpNumber], IBpNumber>;
}