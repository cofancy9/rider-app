package com.riderapp.network.models

data class Permission(
    val name: String,
    val isEnabled: Boolean
)

data class UpdatePermissionRequest(
    val permissions: Map<String, Boolean>
)

data class PermissionResponse(
    val status: String,
    val data: Map<String, Boolean>?,
    val message: String?
)
