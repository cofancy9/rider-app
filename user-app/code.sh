#!/bin/bash

# Create necessary directories
mkdir -p app/src/main/java/com/riderapp/network/models
mkdir -p app/src/main/java/com/riderapp/ui/admin/adapters
mkdir -p app/src/main/java/com/riderapp/ui/admin/permissions
mkdir -p app/src/main/res/layout

# Clear existing model files to prevent duplications
rm -f app/src/main/java/com/riderapp/network/models/AdminModels.kt
rm -f app/src/main/java/com/riderapp/network/models/PermissionModels.kt

# Update ApiService.kt
cat > app/src/main/java/com/riderapp/network/ApiService.kt << 'EOL'
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

    @GET("api/admin/challenges")
    fun getChallenges(
        @Header("Authorization") token: String
    ): Call<ChallengeListResponse>

    @GET("api/admin/challenges/{challengeId}")
    fun getChallengeDetails(
        @Path("challengeId") challengeId: String,
        @Header("Authorization") token: String
    ): Call<ChallengeResponse>

    @GET("api/admin/{adminId}/permissions")
    fun getAdminPermissions(
        @Path("adminId") adminId: String,
        @Header("Authorization") token: String
    ): Call<PermissionResponse>

    @PUT("api/admin/{adminId}/permissions")
    fun updateAdminPermissions(
        @Path("adminId") adminId: String,
        @Body request: UpdatePermissionRequest,
        @Header("Authorization") token: String
    ): Call<PermissionResponse>
}
EOL

# Create Challenge Models
cat > app/src/main/java/com/riderapp/network/models/ChallengeModels.kt << 'EOL'
package com.riderapp.network.models

data class Challenge(
    val id: String,
    val name: String,
    val type: String,
    val minDistance: Int,
    val maxDistance: Int,
    val timeLimit: Int,
    val entryFee: Double,
    val reward: Double,
    val status: String,
    val participants: List<String> = emptyList(),
    val rules: List<String> = emptyList()
)

data class ChallengeResponse(
    val status: String,
    val data: Challenge?,
    val message: String?
)

data class ChallengeListResponse(
    val status: String,
    val data: List<Challenge>,
    val message: String?
)
EOL

# Create Permission Models
cat > app/src/main/java/com/riderapp/network/models/PermissionModels.kt << 'EOL'
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
EOL

# Create Super Admin Dashboard Layout
cat > app/src/main/res/layout/activity_super_admin_dashboard.xml << 'EOL'
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <com.google.android.material.button.MaterialButton
        android:id="@+id/createAdminButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Create Admin" />

    <com.google.android.material.button.MaterialButton
        android:id="@+id/listAdminButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="List Admins" />

    <com.google.android.material.button.MaterialButton
        android:id="@+id/listUsersButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="List Users" />

    <com.google.android.material.button.MaterialButton
        android:id="@+id/listChallengesButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="List Challenges" />

    <com.google.android.material.button.MaterialButton
        android:id="@+id/adminPermissionsButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Admin Permissions" />

    <com.google.android.material.button.MaterialButton
        android:id="@+id/logoutButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="32dp"
        android:text="Logout" />

</LinearLayout>
EOL

# Create SuperAdminDashboardActivity
cat > app/src/main/java/com/riderapp/ui/admin/SuperAdminDashboardActivity.kt << 'EOL'
package com.riderapp.ui.admin

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.riderapp.databinding.ActivitySuperAdminDashboardBinding
import com.riderapp.ui.LoginActivity
import com.riderapp.ui.admin.permissions.AdminPermissionsActivity

class SuperAdminDashboardActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySuperAdminDashboardBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySuperAdminDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupClickListeners()
    }

    private fun setupClickListeners() {
        binding.createAdminButton.setOnClickListener {
            // Will implement in next phase
            // startActivity(Intent(this, CreateAdminActivity::class.java))
        }

        binding.listAdminButton.setOnClickListener {
            startActivity(Intent(this, ListAdminActivity::class.java))
        }

        binding.listUsersButton.setOnClickListener {
            // Will implement in next phase
            // startActivity(Intent(this, ListUsersActivity::class.java))
        }

        binding.listChallengesButton.setOnClickListener {
            // Will implement in next phase
            // startActivity(Intent(this, ListChallengesActivity::class.java))
        }

        binding.adminPermissionsButton.setOnClickListener {
            startActivity(Intent(this, AdminPermissionsActivity::class.java))
        }

        binding.logoutButton.setOnClickListener {
            getSharedPreferences("auth", MODE_PRIVATE)
                .edit()
                .remove("token")
                .apply()
            startActivity(Intent(this, LoginActivity::class.java))
            finishAffinity()
        }
    }
}
EOL

# Create AdminPermissionsActivity
cat > app/src/main/java/com/riderapp/ui/admin/permissions/AdminPermissionsActivity.kt << 'EOL'
package com.riderapp.ui.admin.permissions

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.riderapp.databinding.ActivityAdminPermissionsBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.PermissionResponse
import com.riderapp.network.models.UpdatePermissionRequest
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class AdminPermissionsActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAdminPermissionsBinding
    private lateinit var adminId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminPermissionsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        loadPermissions()
        setupClickListeners()
    }

    private fun setupClickListeners() {
        binding.saveButton.setOnClickListener {
            updatePermissions()
        }
    }

    private fun loadPermissions() {
        showLoading(true)
        val token = getSharedPreferences("auth", MODE_PRIVATE).getString("token", "") ?: ""

        ApiClient.apiService.getAdminPermissions(adminId, "Bearer $token")
            .enqueue(object : Callback<PermissionResponse> {
                override fun onResponse(call: Call<PermissionResponse>, response: Response<PermissionResponse>) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        response.body()?.data?.let { permissions ->
                            updateUI(permissions)
                        }
                    }
                }

                override fun onFailure(call: Call<PermissionResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(this@AdminPermissionsActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun updateUI(permissions: Map<String, Boolean>) {
        with(binding) {
            createChallengeSwitch.isChecked = permissions["CREATE_CHALLENGE"] ?: false
            updateChallengeSwitch.isChecked = permissions["UPDATE_CHALLENGE"] ?: false
            deleteChallengeSwitch.isChecked = permissions["DELETE_CHALLENGE"] ?: false
            viewAnalyticsSwitch.isChecked = permissions["VIEW_ANALYTICS"] ?: false
            manageUsersSwitch.isChecked = permissions["MANAGE_USERS"] ?: false
        }
    }

    private fun updatePermissions() {
        showLoading(true)
        val token = getSharedPreferences("auth", MODE_PRIVATE).getString("token", "") ?: ""

        val permissions = mapOf(
            "CREATE_CHALLENGE" to binding.createChallengeSwitch.isChecked,
            "UPDATE_CHALLENGE" to binding.updateChallengeSwitch.isChecked,
            "DELETE_CHALLENGE" to binding.deleteChallengeSwitch.isChecked,
            "VIEW_ANALYTICS" to binding.viewAnalyticsSwitch.isChecked,
            "MANAGE_USERS" to binding.manageUsersSwitch.isChecked
        )

        val request = UpdatePermissionRequest(permissions)

        ApiClient.apiService.updateAdminPermissions(adminId, request, "Bearer $token")
            .enqueue(object : Callback<PermissionResponse> {
                override fun onResponse(call: Call<PermissionResponse>, response: Response<PermissionResponse>) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        Toast.makeText(this@AdminPermissionsActivity, "Permissions updated", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                }

                override fun onFailure(call: Call<PermissionResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(this@AdminPermissionsActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.saveButton.isEnabled = !show
    }
}
EOL

# Create AdminPermissionsActivity Layout
# Continue AdminPermissionsActivity Layout
cat > app/src/main/res/layout/activity_admin_permissions.xml << 'EOL'
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <com.google.android.material.switchmaterial.SwitchMaterial
        android:id="@+id/createChallengeSwitch"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Create Challenge" />

    <com.google.android.material.switchmaterial.SwitchMaterial
        android:id="@+id/updateChallengeSwitch"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Update Challenge" />

    <com.google.android.material.switchmaterial.SwitchMaterial
        android:id="@+id/deleteChallengeSwitch"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Delete Challenge" />

    <com.google.android.material.switchmaterial.SwitchMaterial
        android:id="@+id/viewAnalyticsSwitch"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="View Analytics" />

    <com.google.android.material.switchmaterial.SwitchMaterial
        android:id="@+id/manageUsersSwitch"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="Manage Users" />

    <com.google.android.material.button.MaterialButton
        android:id="@+id/saveButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="32dp"
        android:text="Save Permissions" />

    <ProgressBar
        android:id="@+id/progressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:layout_marginTop="16dp"
        android:visibility="gone" />

</LinearLayout>
EOL

# Create ListAdminActivity
cat > app/src/main/java/com/riderapp/ui/admin/ListAdminActivity.kt << 'EOL'
package com.riderapp.ui.admin

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.riderapp.databinding.ActivityListAdminBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.AdminListResponse
import com.riderapp.ui.admin.adapters.AdminListAdapter
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ListAdminActivity : AppCompatActivity() {
    private lateinit var binding: ActivityListAdminBinding
    private lateinit var adapter: AdminListAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityListAdminBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        loadAdmins()
    }

    private fun setupRecyclerView() {
        adapter = AdminListAdapter { adminId ->
            removeAdmin(adminId)
        }
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter
    }

    private fun loadAdmins() {
        showLoading(true)
        val token = getSharedPreferences("auth", MODE_PRIVATE).getString("token", "") ?: ""

        ApiClient.apiService.listAdmins("Bearer $token")
            .enqueue(object : Callback<AdminListResponse> {
                override fun onResponse(
                    call: Call<AdminListResponse>,
                    response: Response<AdminListResponse>
                ) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        response.body()?.data?.admins?.let { admins ->
                            adapter.submitList(admins)
                        }
                    } else {
                        Toast.makeText(
                            this@ListAdminActivity,
                            "Failed to load admins",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                override fun onFailure(call: Call<AdminListResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(
                        this@ListAdminActivity,
                        "Error: ${t.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })
    }

    private fun removeAdmin(adminId: String) {
        val token = getSharedPreferences("auth", MODE_PRIVATE).getString("token", "") ?: ""

        ApiClient.apiService.removeAdmin(adminId, "Bearer $token")
            .enqueue(object : Callback<AdminResponse> {
                override fun onResponse(
                    call: Call<AdminResponse>,
                    response: Response<AdminResponse>
                ) {
                    if (response.isSuccessful) {
                        loadAdmins() // Refresh list
                        Toast.makeText(
                            this@ListAdminActivity,
                            "Admin removed successfully",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        Toast.makeText(
                            this@ListAdminActivity,
                            "Failed to remove admin",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                override fun onFailure(call: Call<AdminResponse>, t: Throwable) {
                    Toast.makeText(
                        this@ListAdminActivity,
                        "Error: ${t.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
    }
}
EOL

# Create AdminListAdapter
cat > app/src/main/java/com/riderapp/ui/admin/adapters/AdminListAdapter.kt << 'EOL'
package com.riderapp.ui.admin.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.riderapp.databinding.ItemAdminBinding
import com.riderapp.network.models.Admin

class AdminListAdapter(
    private val onRemoveClick: (String) -> Unit
) : ListAdapter<Admin, AdminListAdapter.ViewHolder>(AdminDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        return ViewHolder(
            ItemAdminBinding.inflate(
                LayoutInflater.from(parent.context),
                parent,
                false
            )
        )
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(
        private val binding: ItemAdminBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(admin: Admin) {
            binding.apply {
                nameText.text = "${admin.firstName} ${admin.lastName}"
                emailText.text = admin.email
                phoneText.text = admin.phoneNumber
                removeButton.setOnClickListener {
                    onRemoveClick(admin.id)
                }
            }
        }
    }

    private class AdminDiffCallback : DiffUtil.ItemCallback<Admin>() {
        override fun areItemsTheSame(oldItem: Admin, newItem: Admin): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Admin, newItem: Admin): Boolean {
            return oldItem == newItem
        }
    }
}
EOL

# Create layout for admin list item
cat > app/src/main/res/layout/item_admin.xml << 'EOL'
<?xml version="1.0" encoding="utf-8"?>
<com.google.android.material.card.MaterialCardView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_margin="8dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <TextView
            android:id="@+id/nameText"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:textSize="16sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/emailText"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp" />

        <TextView
            android:id="@+id/phoneText"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp" />

        <com.google.android.material.button.MaterialButton
            android:id="@+id/removeButton"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="Remove Admin"
            style="@style/Widget.MaterialComponents.Button.OutlinedButton" />

    </LinearLayout>

</com.google.android.material.card.MaterialCardView>
EOL

# Create layout for list admin activity
cat > app/src/main/res/layout/activity_list_admin.xml << 'EOL'
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="16dp">

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/recyclerView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent" />

    <ProgressBar
        android:id="@+id/progressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:visibility="gone"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

</LinearLayout>
EOL

# Make script executable
chmod +x code.sh

echo "All files and directories have been created successfully!"
