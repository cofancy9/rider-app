package com.riderapp.network.models

data class User(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String,
    val userType: String,
    val isPhoneVerified: Boolean,
    val isEmailVerified: Boolean,
    val safetyScore: Int,
    val adminCreated: List<String> = emptyList(),
    val documents: List<String> = emptyList(),
    val emergencyContacts: List<String> = emptyList()
)

data class UserData(
    val user: User,
    val token: String
)

data class LoginRequest(
    val phoneNumber: String,
    val password: String
)

data class LoginResponse(
    val status: String,
    val data: UserData?,
    val message: String?
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String
)

data class RegisterResponse(
    val status: String,
    val data: UserData?,
    val message: String?
)

data class VerifyOtpRequest(
    val otp: String
)

data class VerifyOtpResponse(
    val status: String,
    val message: String
)

data class ResendOtpResponse(
    val status: String,
    val message: String
)

data class Admin(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String,
    val userType: String
)

data class CreateAdminRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String,
    val password: String
)

data class UpdateAdminRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String
)

data class AdminResponse(
    val status: String,
    val data: Admin?,
    val message: String?
)

data class AdminListResponse(
    val status: String,
    val data: AdminList,
    val message: String?
)

data class AdminList(
    val admins: List<Admin>
)

data class BaseResponse(
    val status: String,
    val message: String?
)
