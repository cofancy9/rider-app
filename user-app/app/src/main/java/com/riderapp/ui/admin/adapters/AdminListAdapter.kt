package com.riderapp.ui.admin.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.riderapp.databinding.ItemAdminBinding
import com.riderapp.network.models.Admin

class AdminListAdapter(
    private val onAdminSelect: (String) -> Unit,
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

    inner class ViewHolder(private val binding: ItemAdminBinding) : 
        RecyclerView.ViewHolder(binding.root) {

        init {
            binding.root.setOnClickListener {
                onAdminSelect(getItem(adapterPosition).id)
            }
        }

        fun bind(admin: Admin) {
            binding.apply {
                nameText.text = "${admin.firstName} ${admin.lastName}"
                emailText.text = admin.email
                phoneText.text = admin.phoneNumber
                removeCheckBox.setOnCheckedChangeListener { _, isChecked ->
                    if (isChecked) {
                        onRemoveClick(admin.id)
                    }
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
