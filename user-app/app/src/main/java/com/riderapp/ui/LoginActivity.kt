package com.riderapp.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.riderapp.databinding.ActivityLoginBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.LoginRequest
import com.riderapp.network.models.LoginResponse
import com.riderapp.ui.admin.SuperAdminDashboardActivity
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setupClickListeners()
    }

    private fun setupClickListeners() {
        binding.loginButton.setOnClickListener {
            if (validateInputs()) {
                login()
            }
        }

        binding.registerLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        with(binding) {
            if (phoneEdit.text.isNullOrBlank()) {
                phoneLayout.error = "Phone number is required"
                isValid = false
            } else {
                phoneLayout.error = null
            }

            if (passwordEdit.text.isNullOrBlank()) {
                passwordLayout.error = "Password is required"
                isValid = false
            } else {
                passwordLayout.error = null
            }
        }

        return isValid
    }

    private fun login() {
        showLoading(true)

        val request = LoginRequest(
            phoneNumber = "+91${binding.phoneEdit.text}",
            password = binding.passwordEdit.text.toString()
        )

        ApiClient.apiService.login(request).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                showLoading(false)
                if (response.isSuccessful) {
                    response.body()?.data?.let { userData ->
                        // Save token
                        getSharedPreferences("auth", MODE_PRIVATE)
                            .edit()
                            .putString("token", userData.token)
                            .apply()

                        when (userData.user.userType) {
                            "super_admin" -> {
                                startActivity(Intent(this@LoginActivity, SuperAdminDashboardActivity::class.java))
                                finish()
                            }
                            else -> {
                                // Navigate to OTP verification for non-super admin users
                                startActivity(Intent(this@LoginActivity, VerifyOtpActivity::class.java).apply {
                                    putExtra("phone", "+91${binding.phoneEdit.text}")
                                })
                                finish()
                            }
                        }
                    }
                } else {
                    Toast.makeText(
                        this@LoginActivity,
                        "Login failed: ${response.message()}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }

            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                showLoading(false)
                Toast.makeText(
                    this@LoginActivity,
                    "Error: ${t.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        })
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.loginButton.isEnabled = !show
    }
}
