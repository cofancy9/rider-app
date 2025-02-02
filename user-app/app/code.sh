#!/bin/bash

# Create CreateAdminActivity
cat > src/main/java/com/riderapp/ui/admin/CreateAdminActivity.kt << 'EOL'
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
EOL

# Create corresponding layout
cat > src/main/res/layout/activity_create_admin.xml << 'EOL'
<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="16dp">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical">

        <com.google.android.material.textfield.TextInputLayout
            android:id="@+id/firstNameLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox">

            <com.google.android.material.textfield.TextInputEditText
                android:id="@+id/firstNameEdit"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:hint="First Name"
                android:inputType="textPersonName" />
        </com.google.android.material.textfield.TextInputLayout>

        <com.google.android.material.textfield.TextInputLayout
            android:id="@+id/lastNameLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox">

            <com.google.android.material.textfield.TextInputEditText
                android:id="@+id/lastNameEdit"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:hint="Last Name"
                android:inputType="textPersonName" />
        </com.google.android.material.textfield.TextInputLayout>

        <com.google.android.material.textfield.TextInputLayout
            android:id="@+id/emailLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox">

            <com.google.android.material.textfield.TextInputEditText
                android:id="@+id/emailEdit"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:hint="Email"
                android:inputType="textEmailAddress" />
        </com.google.android.material.textfield.TextInputLayout>

        <com.google.android.material.textfield.TextInputLayout
            android:id="@+id/phoneLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox"
            android:hint="Phone Number">

            <com.google.android.material.textfield.TextInputEditText
                android:id="@+id/phoneEdit"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:inputType="phone" />
        </com.google.android.material.textfield.TextInputLayout>

        <com.google.android.material.textfield.TextInputLayout
            android:id="@+id/passwordLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            style="@style/Widget.MaterialComponents.TextInputLayout.OutlinedBox"
            android:hint="Password">

            <com.google.android.material.textfield.TextInputEditText
                android:id="@+id/passwordEdit"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:inputType="textPassword" />
        </com.google.android.material.textfield.TextInputLayout>

        <com.google.android.material.button.MaterialButton
            android:id="@+id/createButton"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="24dp"
            android:text="Create Admin" />

        <ProgressBar
            android:id="@+id/progressBar"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_gravity="center"
            android:layout_marginTop="16dp"
            android:visibility="gone" />

    </LinearLayout>
</ScrollView>
EOL

chmod +x code.sh
echo "Done"