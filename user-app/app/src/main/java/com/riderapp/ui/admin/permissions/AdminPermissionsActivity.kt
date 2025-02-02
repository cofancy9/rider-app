package com.riderapp.ui.admin.permissions

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.riderapp.databinding.ActivityAdminPermissionsBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.PermissionResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class AdminPermissionsActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAdminPermissionsBinding
    private lateinit var adminId: String
    private val token by lazy { getSharedPreferences("auth", MODE_PRIVATE).getString("token", "") ?: "" }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminPermissionsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupClickListeners()
    }

    private fun setupClickListeners() {
        binding.saveButton.setOnClickListener {
            updatePermissions()
        }
    }

    private fun updatePermissions() {
        showLoading(true)

        val permissions = mapOf(
            "CREATE_CHALLENGE" to binding.createChallengeSwitch.isChecked,
            "UPDATE_CHALLENGE" to binding.updateChallengeSwitch.isChecked,
            "DELETE_CHALLENGE" to binding.deleteChallengeSwitch.isChecked,
            "VIEW_ANALYTICS" to binding.viewAnalyticsSwitch.isChecked,
            "MANAGE_USERS" to binding.manageUsersSwitch.isChecked
        )

        ApiClient.apiService.updateAdminPermissions(adminId, permissions, "Bearer $token")
            .enqueue(object : Callback<PermissionResponse> {
                override fun onResponse(call: Call<PermissionResponse>, response: Response<PermissionResponse>) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        Toast.makeText(this@AdminPermissionsActivity, "Permissions updated successfully", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AdminPermissionsActivity, "Failed to update permissions", Toast.LENGTH_SHORT).show()
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
