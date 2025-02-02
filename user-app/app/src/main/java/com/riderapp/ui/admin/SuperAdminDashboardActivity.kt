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
            startActivity(Intent(this, CreateAdminActivity::class.java))
        }

        binding.listAdminButton.setOnClickListener {
            startActivity(Intent(this, ListAdminActivity::class.java))
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
