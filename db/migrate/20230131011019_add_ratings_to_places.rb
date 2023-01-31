class AddRatingsToPlaces < ActiveRecord::Migration[7.0]
  def change
    add_column :places, :rating, :integer
  end
end
