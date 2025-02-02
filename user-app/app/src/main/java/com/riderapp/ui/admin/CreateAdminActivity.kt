package com.riderapp.ui.admin

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.riderapp.databinding.ActivityCreateAdminBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.AdminResponse
import com.riderapp.network.models.CreateAdminRequest
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class CreateAdminActivity : AppCompatActivity() {
    private lateinit var binding: ActivityCreateAdminBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCreateAdminBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.createButton.setOnClickListener {
            if (validateInputs()) {
                createAdmin()
            }
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true
        with(binding) {
            if (firstNameEdit.text.isNullOrBlank()) {
                firstNameLayout.error = "Required"
                isValid = false
            }
            if (lastNameEdit.text.isNullOrBlank()) {
                lastNameLayout.error = "Required"
                isValid = false
            }
            if (emailEdit.text.isNullOrBlank()) {
                emailLayout.error = "Required"
                isValid = false
            }
            if (phoneEdit.text.isNullOrBlank()) {
                phoneLayout.error = "Required"
                isValid = false
            }
            if (passwordEdit.text.isNullOrBlank()) {
                passwordLayout.error = "Required"
                isValid = false
            }
        }
        return isValid
    }

    private fun createAdmin() {
        showLoading(true)
        val token = getSharedPreferences("auth", MODE_PRIVATE).getString("token", "") ?: ""
        
        val request = CreateAdminRequest(
            firstName = binding.firstNameEdit.text.toString(),
            lastName = binding.lastNameEdit.text.toString(),
            email = binding.emailEdit.text.toString(),
            phoneNumber = binding.phoneEdit.text.toString(),
            password = binding.passwordEdit.text.toString()
        )

        ApiClient.apiService.createAdmin(request, "Bearer $token")
            .enqueue(object : Callback<AdminResponse> {
                override fun onResponse(call: Call<AdminResponse>, response: Response<AdminResponse>) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        Toast.makeText(this@CreateAdminActivity, "Admin created successfully", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@CreateAdminActivity, "Failed to create admin", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<AdminResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(this@CreateAdminActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.createButton.isEnabled = !show
    }
}
