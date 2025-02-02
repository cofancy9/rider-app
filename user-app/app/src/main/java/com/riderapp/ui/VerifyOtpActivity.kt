package com.riderapp.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.riderapp.databinding.ActivityVerifyOtpBinding
import com.riderapp.network.ApiClient
import com.riderapp.network.models.ResendOtpResponse
import com.riderapp.network.models.VerifyOtpRequest
import com.riderapp.network.models.VerifyOtpResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class VerifyOtpActivity : AppCompatActivity() {
    private lateinit var binding: ActivityVerifyOtpBinding
    private var phoneNumber: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVerifyOtpBinding.inflate(layoutInflater)
        setContentView(binding.root)

        phoneNumber = intent.getStringExtra("phone")
        binding.subtitleText.text = "Enter OTP sent to $phoneNumber"

        setupClickListeners()
    }

    private fun setupClickListeners() {
        binding.verifyButton.setOnClickListener {
            if (validateOtp()) {
                verifyOtp()
            }
        }

        binding.resendOtp.setOnClickListener {
            resendOtp()
        }
    }

    private fun validateOtp(): Boolean {
        return if (binding.otpEdit.text.isNullOrBlank()) {
            binding.otpLayout.error = "OTP is required"
            false
        } else if (binding.otpEdit.text?.length != 6) {
            binding.otpLayout.error = "Enter valid 6-digit OTP"
            false
        } else {
            binding.otpLayout.error = null
            true
        }
    }

    private fun getStoredToken(): String {
        return "Bearer ${getSharedPreferences("auth", MODE_PRIVATE).getString("token", "")}"
    }

    private fun verifyOtp() {
        showLoading(true)
        val request = VerifyOtpRequest(otp = binding.otpEdit.text.toString())

        ApiClient.apiService.verifyOtp(request, getStoredToken())
            .enqueue(object : Callback<VerifyOtpResponse> {
                override fun onResponse(call: Call<VerifyOtpResponse>, response: Response<VerifyOtpResponse>) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        startActivity(Intent(this@VerifyOtpActivity, HomeActivity::class.java))
                        finishAffinity()
                    } else {
                        Toast.makeText(
                            this@VerifyOtpActivity,
                            "Verification failed: ${response.message()}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                override fun onFailure(call: Call<VerifyOtpResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(
                        this@VerifyOtpActivity,
                        "Error: ${t.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })
    }

    private fun resendOtp() {
        showLoading(true)
        ApiClient.apiService.resendOtp(getStoredToken())
            .enqueue(object : Callback<ResendOtpResponse> {
                override fun onResponse(call: Call<ResendOtpResponse>, response: Response<ResendOtpResponse>) {
                    showLoading(false)
                    if (response.isSuccessful) {
                        Toast.makeText(
                            this@VerifyOtpActivity,
                            "OTP resent successfully",
                            Toast.LENGTH_SHORT
                        ).show()
                    } else {
                        Toast.makeText(
                            this@VerifyOtpActivity,
                            "Failed to resend OTP",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                override fun onFailure(call: Call<ResendOtpResponse>, t: Throwable) {
                    showLoading(false)
                    Toast.makeText(
                        this@VerifyOtpActivity,
                        "Error: ${t.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })
    }

    private fun showLoading(show: Boolean) {
        binding.progressBar.visibility = if (show) View.VISIBLE else View.GONE
        binding.verifyButton.isEnabled = !show
        binding.resendOtp.isEnabled = !show
    }
}
