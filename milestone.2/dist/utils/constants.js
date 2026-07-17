"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_STATUSES = exports.EMPLOYEE_STATUSES = exports.ROLES = exports.PaymentStatus = exports.EmployeeStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "Admin";
    UserRole["HR"] = "HR";
    UserRole["MANAGER"] = "Manager";
    UserRole["EMPLOYEE"] = "Employee";
})(UserRole || (exports.UserRole = UserRole = {}));
var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["ACTIVE"] = "Active";
    EmployeeStatus["INACTIVE"] = "Inactive";
    EmployeeStatus["TERMINATED"] = "Terminated";
})(EmployeeStatus || (exports.EmployeeStatus = EmployeeStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "Pending";
    PaymentStatus["APPROVED"] = "Approved";
    PaymentStatus["PAID"] = "Paid";
    PaymentStatus["REJECTED"] = "Rejected";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
exports.ROLES = Object.values(UserRole);
exports.EMPLOYEE_STATUSES = Object.values(EmployeeStatus);
exports.PAYMENT_STATUSES = Object.values(PaymentStatus);
//# sourceMappingURL=constants.js.map