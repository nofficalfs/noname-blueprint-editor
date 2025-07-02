import { IBpArray, IBpData, IBpString } from "../../dataType";
import { IBpBuiltinLinq } from "../../function";

export namespace BpArray {
    const filter: IBpBuiltinLinq<'filter', IBpArray<IBpData>, [IBpString], IBpArray<IBpData>>;
}