import { IBpString, IBpNumber, IBpArray } from "../../dataType";
import { IBpBuiltinFunction } from "../../function"

export namespace BpString {
    const indexOf: IBpBuiltinFunction<'indexOf', [IBpString, IBpString], IBpNumber>;
    const slice: IBpBuiltinFunction<'slice', [IBpString, IBpNumber, IBpNumber], IBpString>;
    const split: IBpBuiltinFunction<'split', [IBpString, IBpString], IBpArray<IBpString>>;
}