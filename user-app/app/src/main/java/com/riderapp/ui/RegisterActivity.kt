package com.riderapp.ui

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.riderapp.databinding.ActivityRegisterBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.RegisterRequest
import com.riderapp.network.models.RegisterResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    private fun setupListeners() {
        binding.registerButton.setOnClickListener {
            if (validateInputs()) {
                registerUser()
            }
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        with(binding) {
            if (firstNameEdit.text.isNullOrBlank()) {
                firstNameLayout.error = "First name is required"
                isValid = false
            } else {
                firstNameLayout.error = null
            }

            if (lastNameEdit.text.isNullOrBlank()) {
                lastNameLayout.error = "Last name is required"
                isValid = false
            } else {
                lastNameLayout.error = null
            }

            if (emailEdit.text.isNullOrBlank()) {
                emailLayout.error = "Email is required"
                isValid = false
            } else {
                emailLayout.error = null
            }

            if (phoneEdit.text.isNullOrBlank()) {
                phoneLayout.error = "Phone number is required"
                isValid = false
            } else {
                phoneLayout.error = null
            }

            if (passwordEdit.text.isNullOrBlank()) {
                passwordLayout.error = "Password is required"
                isValid = false
            } else if (passwordEdit.text?.length ?: 0 < 8) {
                passwordLayout.error = "Password must be at least 8 characters"
                isValid = false
            } else {
                passwordLayout.error = null
            }
        }

        return isValid
    }

    private fun registerUser() {
        showLoading(true)

        val request = RegisterRequest(
            firstName = binding.firstNameEdit.text.toString(),
            lastName = binding.lastNameEdit.text.toString(),
            email = binding.emailEdit.text.toString(),
            phoneNumber = "+91${binding.phoneEdit.text}",
            password = binding.passwordEdit.text.toString()
        )

        ApiClient.apiService.register(request).enqueue(object : Callback<RegisterResponse> {
            override fun onResponse(call: Call<RegisterResponse>, response: Response<RegisterResponse>) {
                showLoading(false)
                if (response.isSuccessful) {
                    Toast.makeText(this@RegisterActivity, "Registration successful!", Toast.LENGTH_SHORT).show()
                    // Handle successful registration (e.g., navigate to OTP verification)
                } else {
                    Toast.makeText(this@RegisterActivity, "Registration failed: ${response.message()}", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<RegisterResponse>, t: Throwable) {
                showLoading(false)
                Toast.makeText(this@RegisterActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.registerButton.isEnabled = !show
    }
}
