package com.riderapp.network

import com.riderapp.network.models.*
import retrofit2.Call
import retrofit2.http.*

interface ApiService {
   @POST("api/auth/register")
   fun register(@Body request: RegisterRequest): Call<RegisterResponse>

   @POST("api/auth/login")
   fun login(@Body request: LoginRequest): Call<LoginResponse>

   @POST("api/auth/verify-phone")
   fun verifyOtp(
       @Body request: VerifyOtpRequest,
       @Header("Authorization") token: String
   ): Call<VerifyOtpResponse>

   @POST("api/auth/resend-phone-otp")
   @Headers("Content-Type: application/json")
   fun resendOtp(
       @Header("Authorization") token: String
   ): Call<ResendOtpResponse>

   @POST("api/admin/create-admin")
   fun createAdmin(
       @Body request: CreateAdminRequest,
       @Header("Authorization") token: String
   ): Call<AdminResponse>

   @GET("api/admin/admins")
   fun listAdmins(
       @Header("Authorization") token: String
   ): Call<AdminListResponse>

   @GET("api/admin/admins/{adminId}")
   fun getAdmin(
       @Path("adminId") adminId: String,
       @Header("Authorization") token: String
   ): Call<AdminResponse>

   @PUT("api/admin/admins/{adminId}")
   fun updateAdmin(
       @Path("adminId") adminId: String,
       @Body request: UpdateAdminRequest,
       @Header("Authorization") token: String
   ): Call<AdminResponse>

   @DELETE("api/admin/admins/{adminId}")
   fun removeAdmin(
       @Path("adminId") adminId: String,
       @Header("Authorization") token: String
   ): Call<AdminResponse>

   @DELETE("api/admin/users/{userId}")
   fun deleteUser(
       @Path("userId") userId: String,
       @Header("Authorization") token: String
   ): Call<BaseResponse>

   @POST("api/admin/permissions/{adminId}")
   fun updateAdminPermissions(
       @Path("adminId") adminId: String,
       @Body permissions: Map<String, Boolean>,
       @Header("Authorization") token: String
   ): Call<PermissionResponse>
}
