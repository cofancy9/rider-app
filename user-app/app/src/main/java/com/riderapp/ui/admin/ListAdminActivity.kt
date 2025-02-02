package com.riderapp.ui.admin

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.riderapp.databinding.ActivityListAdminBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.AdminResponse
import com.riderapp.network.models.AdminListResponse
import com.riderapp.ui.admin.adapters.AdminListAdapter
import com.riderapp.ui.admin.permissions.AdminPermissionsActivity
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ListAdminActivity : AppCompatActivity() {
    private lateinit var binding: ActivityListAdminBinding
    private lateinit var adapter: AdminListAdapter
    private var token = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityListAdminBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        token = getSharedPreferences("auth", MODE_PRIVATE).getString("token", "") ?: ""
        setupRecyclerView()
        loadAdmins()
    }

    private fun setupRecyclerView() {
        adapter = AdminListAdapter(
            onAdminSelect = { adminId ->
                val intent = Intent(this, AdminPermissionsActivity::class.java)
                intent.putExtra("adminId", adminId)
                startActivity(intent)
            },
            onRemoveClick = { adminId ->
                removeAdmin(adminId)
            }
        )
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter
    }

    private fun loadAdmins() {
        showLoading(true)
        ApiClient.apiService.listAdmins("Bearer $token")
            .enqueue(object : Callback<AdminListResponse> {
                override fun onResponse(call: Call<AdminListResponse>, response: Response<AdminListResponse>) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        response.body()?.data?.admins?.let { admins ->
                            adapter.submitList(admins)
                        }
                    } else {
                        Toast.makeText(this@ListAdminActivity, "Failed to load admins", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<AdminListResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(this@ListAdminActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun removeAdmin(adminId: String) {
        showLoading(true)
        ApiClient.apiService.removeAdmin(adminId, "Bearer $token")
            .enqueue(object : Callback<AdminResponse> {
                override fun onResponse(call: Call<AdminResponse>, response: Response<AdminResponse>) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@ListAdminActivity, "Admin removed successfully", Toast.LENGTH_SHORT).show()
                        loadAdmins()
                    } else {
                        showLoading(false)
                        Toast.makeText(this@ListAdminActivity, "Failed to remove admin", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<AdminResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(this@ListAdminActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
    }
}
