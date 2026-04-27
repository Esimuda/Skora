"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateClassDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_class_dto_1 = require("./create-class.dto");
class UpdateClassDto extends (0, mapped_types_1.PartialType)(create_class_dto_1.CreateClassDto) {
}
exports.UpdateClassDto = UpdateClassDto;
//# sourceMappingURL=update-class.dto.js.map